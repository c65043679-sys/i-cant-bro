import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  Sparkles, 
  Send, 
  Check, 
  Trash2, 
  Plus,
  Pencil,
  X,
  LogIn,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameReview } from '../types';
import { useAuth } from './AuthContext';
import { useAchievements } from './AchievementsContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { soundManager } from '../utils/soundEffects';

interface GameReviewsProps {
  gameId: string;
  gameTitle: string;
}

export const GameReviews: React.FC<GameReviewsProps> = ({ gameId, gameTitle }) => {
  const { user, profile, isOwner, signIn } = useAuth();
  const { addGameTimePoints } = useAchievements();

  // Reviews state (real player reviews only)
  const [reviews, setReviews] = useState<GameReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');

  // Form input state: Review message only
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Author display name (only applicable when user has an account)
  const authorDisplayName = useMemo(() => {
    return profile?.displayName || user?.displayName || 'Nexus Operative';
  }, [profile, user]);

  // Check if current authenticated user already has a review for this game (1 review per game limit)
  const existingUserReview = useMemo(() => {
    if (!user) return null;
    return reviews.find(r => r.userId === user.uid) || null;
  }, [reviews, user]);

  // Upvoted reviews tracking in localStorage
  const [likedReviews, setLikedReviews] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_liked_reviews');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load reviews from Backend Server API, Live Stream (SSE), Firestore & local storage
  useEffect(() => {
    setLoading(true);
    const localKey = `nexus_reviews_${gameId}`;
    let cachedReviews: GameReview[] = [];

    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed: GameReview[] = JSON.parse(saved);
        // Exclude any legacy seed/bot reviews
        cachedReviews = parsed.filter(r => !r.id.startsWith('seed_') && !r.userId?.startsWith('seed-'));
      }
    } catch (e) {
      console.warn('Error reading cached reviews:', e);
    }

    if (cachedReviews.length > 0) {
      setReviews(cachedReviews);
    }

    // Helper to merge incoming reviews into state without duplicates
    const mergeReviews = (incomingList: GameReview[]) => {
      setReviews(prev => {
        const map = new Map<string, GameReview>();
        prev.forEach(r => map.set(r.id, r));
        incomingList.forEach(r => {
          if (!r.id.startsWith('seed_') && !r.userId?.startsWith('seed-')) {
            map.set(r.id, r);
          }
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem(localKey, JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });
      setLoading(false);
    };

    // 1. Fetch from authoritative Server API (works across all browsers, school networks & proxies)
    fetch(`/api/reviews?gameId=${encodeURIComponent(gameId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.reviews)) {
          mergeReviews(data.reviews);
        }
      })
      .catch(err => {
        console.warn('[GameReviews] Server fetch notice:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Connect to Server-Sent Events (SSE) for instantaneous cross-user review sync
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/live-stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'review' && payload.data) {
            const { action, review, reviewId, helpfulCount, gameId: eventGameId } = payload.data;
            if (eventGameId === gameId || review?.gameId === gameId) {
              if (action === 'upsert' && review) {
                mergeReviews([review]);
              } else if (action === 'helpful' && reviewId) {
                setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: Number(helpfulCount) || r.helpfulCount } : r));
              } else if (action === 'delete' && reviewId) {
                setReviews(prev => prev.filter(r => r.id !== reviewId));
              }
            }
          } else if (payload.type === 'init' && Array.isArray(payload.reviews)) {
            const matching = payload.reviews.filter((r: any) => r.gameId === gameId);
            if (matching.length > 0) {
              mergeReviews(matching);
            }
          }
        } catch (e) {}
      };
    } catch (e) {
      console.warn('[GameReviews] SSE connection notice:', e);
    }

    // 3. Auto-sync any locally cached review belonging to the logged-in user to Server API & Firestore
    if (cachedReviews.length > 0 && user) {
      const myLocal = cachedReviews.find(r => r.userId === user.uid);
      if (myLocal) {
        fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(myLocal)
        }).catch(() => {});

        if (db) {
          setDoc(doc(db, 'game_reviews', myLocal.id), myLocal, { merge: true }).catch(() => {});
        }
      }
    }

    // 4. Firestore listener (dual sync layer)
    let unsubscribe: (() => void) | null = null;
    try {
      if (db) {
        const reviewsRef = collection(db, 'game_reviews');
        const q = query(reviewsRef, where('gameId', '==', gameId));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const remoteReviews: GameReview[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id.startsWith('seed_') || data.userId?.startsWith('seed-')) return;
            remoteReviews.push({
              id: docSnap.id,
              gameId: data.gameId || gameId,
              userId: data.userId || 'anon',
              userName: data.userName || 'Nexus Operative',
              userAvatar: data.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.userId || 'user')}`,
              comment: data.comment || '',
              helpfulCount: Number(data.helpfulCount) || 0,
              likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
              createdAt: Number(data.createdAt) || Date.now()
            });
          });

          if (remoteReviews.length > 0) {
            mergeReviews(remoteReviews);
          }
        }, (err) => {
          console.warn('[GameReviews] Firestore listener notice:', err);
        });
      }
    } catch (err) {
      console.warn('Failed to subscribe to firestore game_reviews:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (eventSource) eventSource.close();
    };
  }, [gameId, user?.uid]);

  // Open Form Handler: pre-populates existing review if user already reviewed this game
  const handleOpenForm = () => {
    soundManager.playClick();
    if (!user) {
      setIsFormOpen(true);
      return;
    }
    if (existingUserReview) {
      setCommentText(existingUserReview.comment);
    } else {
      setCommentText('');
    }
    setIsFormOpen(prev => !prev);
  };

  // Submit Review Handler (Enforces 1 review per user per game; writes cleanly to Firestore)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      soundManager.playClick();
      await signIn();
      return;
    }

    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const authorName = authorDisplayName;
    const isEditing = !!existingUserReview;

    // Use deterministic ID per user per game to enforce 1-review guarantee at database level
    const reviewId = existingUserReview ? existingUserReview.id : `rev_${gameId}_${user.uid}`;
    
    // Explicitly sanitize every field to guarantee valid Firestore data types
    const sanitizedReview: GameReview = {
      id: String(reviewId),
      gameId: String(gameId),
      userId: String(user.uid),
      userName: String(authorName || 'Nexus Operative'),
      userAvatar: String(profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.uid)}`),
      comment: String(commentText.trim()),
      helpfulCount: Number(existingUserReview ? existingUserReview.helpfulCount : 0),
      likedBy: Array.isArray(existingUserReview?.likedBy) ? existingUserReview.likedBy : [],
      createdAt: Number(existingUserReview ? existingUserReview.createdAt : Date.now())
    };

    // Update local state: Replace any existing review from this user so only 1 exists
    setReviews(prev => [
      sanitizedReview, 
      ...prev.filter(r => r.id !== reviewId && r.userId !== user.uid)
    ]);

    const localKey = `nexus_reviews_${gameId}`;
    try {
      const currentSaved: GameReview[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtered = currentSaved.filter(r => r.id !== reviewId && r.userId !== user.uid && !r.id.startsWith('seed_'));
      localStorage.setItem(localKey, JSON.stringify([sanitizedReview, ...filtered]));
    } catch (e) {}

    // 1. Post to Server API (100% reliable across all devices, domains, and school networks)
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedReview)
    }).then(res => {
      if (res.ok) console.log('[GameReviews] Successfully synced review to server API');
    }).catch(err => {
      console.warn('[GameReviews] Server API post notice:', err);
    });

    // 2. Synchronize to Firestore cloud collection (secondary cloud backup)
    try {
      if (db) {
        await setDoc(doc(db, 'game_reviews', reviewId), sanitizedReview, { merge: true });
        console.log('[GameReviews] Successfully synchronized review to Firestore:', reviewId);
      }
    } catch (err) {
      console.warn('[GameReviews] Firestore write notice:', err);
    }

    // Award +25 XP only for new reviews
    if (!isEditing) {
      try {
        addGameTimePoints(25);
      } catch (e) {}
    }

    // Audio & Confetti
    try {
      soundManager.playClick();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    setIsSubmitting(false);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setIsFormOpen(false);
    }, 1500);
  };

  // Upvote / Helpful Handler
  const handleToggleHelpful = async (reviewId: string) => {
    const isAlreadyLiked = likedReviews.includes(reviewId);
    const nextLiked = isAlreadyLiked 
      ? likedReviews.filter(id => id !== reviewId)
      : [...likedReviews, reviewId];
    
    setLikedReviews(nextLiked);
    localStorage.setItem('nexus_liked_reviews', JSON.stringify(nextLiked));
    soundManager.playClick();

    const delta = isAlreadyLiked ? -1 : 1;

    // Optimistic UI update
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          helpfulCount: Math.max(0, r.helpfulCount + delta)
        };
      }
      return r;
    }));

    // Update in Server API
    fetch(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    }).catch(() => {});

    // Update in Firestore
    try {
      if (db) {
        const reviewRef = doc(db, 'game_reviews', reviewId);
        await updateDoc(reviewRef, {
          helpfulCount: increment(delta)
        });
      }
    } catch (err) {
      console.warn('Helpful upvote synced locally. Remote notice:', err);
    }
  };

  // Delete Review Handler (author or admin only)
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    soundManager.playClick();
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    if (existingUserReview?.id === reviewId) {
      setCommentText('');
    }

    const localKey = `nexus_reviews_${gameId}`;
    try {
      const currentSaved: GameReview[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify(currentSaved.filter(r => r.id !== reviewId)));
    } catch (e) {}

    // Delete in Server API
    fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE'
    }).catch(() => {});

    // Delete in Firestore
    try {
      if (db) {
        await deleteDoc(doc(db, 'game_reviews', reviewId));
      }
    } catch (err) {
      console.warn('Delete review remote notice:', err);
    }
  };

  // Sort reviews
  const displayedReviews = useMemo(() => {
    const result = [...reviews];
    result.sort((a, b) => {
      if (sortBy === 'helpful') {
        return b.helpfulCount - a.helpfulCount || b.createdAt - a.createdAt;
      }
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [reviews, sortBy]);

  return (
    <div id="community-reviews-section" className="space-y-6 pt-4 border-t border-white/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Player Reviews
            </h2>
            <p className="text-xs text-slate-400">
              {reviews.length === 0 
                ? `No reviews yet for ${gameTitle}`
                : `${reviews.length} player review${reviews.length === 1 ? '' : 's'} for ${gameTitle}`
              }
            </p>
          </div>
        </div>

        {/* Header Button: Adapts whether user has already posted their 1 review or not */}
        {(reviews.length > 0 || isFormOpen) && (
          <button
            onClick={handleOpenForm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
          >
            {isFormOpen ? (
              <>Close</>
            ) : !user ? (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In to Review</span>
              </>
            ) : existingUserReview ? (
              <>
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Your Review</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Leave a Review</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* When no reviews exist and form is closed: Single clean card with one button */}
      {reviews.length === 0 && !isFormOpen && !loading && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No reviews yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {user 
                ? `Be the first player to share your thoughts, tips, or feedback on ${gameTitle}!`
                : `Sign in to your account to be the first to review ${gameTitle} and earn +25 Operative Points!`
              }
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenForm}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              {!user ? (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Sign In to Leave a Review</span>
                </>
              ) : existingUserReview ? (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Your Review</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Leave a Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Account Required Callout (When user tries to review without an account) */}
      {isFormOpen && !user && (
        <div className="bg-slate-900/95 border border-[var(--accent)]/30 p-6 sm:p-8 rounded-2xl backdrop-blur-xl shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto text-[var(--accent)]">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Account Required to Review</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Only authenticated players with a Nexus account can post reviews, earn <span className="text-amber-400 font-semibold">+25 Operative Points</span>, and prevent spam.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setIsFormOpen(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                soundManager.playClick();
                await signIn();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      )}

      {/* Review Submission / Editing Form: Only available when user has an account */}
      {isFormOpen && user && (
        <form 
          onSubmit={handleSubmitReview}
          className="bg-slate-900/90 border border-[var(--accent)]/30 p-6 rounded-2xl backdrop-blur-xl shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-white">
              {existingUserReview ? (
                <Pencil className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              )}
              <h3 className="font-bold text-base">
                {existingUserReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {existingUserReview ? (
                <span className="px-2.5 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider">
                  1 Review Per Game • Updating
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  +25 Operative Points
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsFormOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Review Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between">
              <span>Your Review</span>
              <span className="text-[10px] text-slate-500 font-mono">{commentText.length}/500</span>
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
              placeholder="What did you think of this game? Share your tips, thoughts, or experience..."
              rows={4}
              required
              className="w-full bg-black/50 border border-white/10 focus:border-[var(--accent)] rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Post Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-400">
              Posting as <span className="text-white font-semibold">{authorDisplayName}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setIsFormOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {submittedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3] text-black" />
                    <span>{existingUserReview ? 'Updated!' : 'Posted!'}</span>
                  </>
                ) : isSubmitting ? (
                  <span>{existingUserReview ? 'Updating...' : 'Posting...'}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{existingUserReview ? 'Update Review' : 'Post Review (+25 XP)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sorting Controls (Only shown if multiple reviews exist) */}
      {reviews.length > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/40 border border-white/10 text-xs text-slate-200 font-semibold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-[var(--accent)]"
          >
            <option value="helpful">Most Helpful</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {displayedReviews.map((review) => {
            const isLiked = likedReviews.includes(review.id);
            const isAuthor = user ? review.userId === user.uid : false;
            const canDelete = isAuthor || isOwner;

            return (
              <div 
                key={review.id}
                className={`bg-white/5 border p-5 rounded-2xl backdrop-blur-sm transition-all space-y-3 ${
                  isAuthor ? 'border-[var(--accent)]/30 bg-[var(--accent)]/[0.02]' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Author row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(review.userName)}`}
                      alt={review.userName}
                      className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {review.userName}
                        </span>
                        {isAuthor && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-bold uppercase">
                            Your Review
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatTimeAgo(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Author can edit their single review */}
                    {isAuthor && (
                      <button
                        onClick={handleOpenForm}
                        className="text-slate-400 hover:text-[var(--accent)] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                        title="Edit your review"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Edit</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Message Text */}
                <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                  {review.comment}
                </p>

                {/* Footer / Helpful upvote */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                  <span className="text-[11px] text-slate-500">
                    Was this review helpful?
                  </span>

                  <button
                    onClick={() => handleToggleHelpful(review.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                      isLiked
                        ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>Helpful</span>
                    {review.helpfulCount > 0 && (
                      <span className="font-mono ml-0.5 font-bold">({review.helpfulCount})</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper for relative timestamps
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(minutes / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
