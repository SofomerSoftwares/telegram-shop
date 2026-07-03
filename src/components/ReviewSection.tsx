import { useState, useEffect, FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Review } from '../types';
import { Star, User, Calendar, MessageSquare, Send } from 'lucide-react';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewSectionProps {
  productId: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load reviews on mount/productId change
  useEffect(() => {
    setLoading(true);
    const reviewsPath = `products/${productId}/reviews`;
    const q = query(
      collection(db, reviewsPath),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Review);
        });
        setReviews(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, reviewsPath);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  // Calculate statistics
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1)
    : '0.0';

  // Submitting the form
  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error('Please enter your name.', 'Name Required');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a comment.', 'Review Required');
      return;
    }

    setSubmitting(true);
    const reviewsPath = `products/${productId}/reviews`;

    try {
      const reviewData = {
        productId,
        rating,
        comment: comment.trim(),
        userName: userName.trim(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, reviewsPath), reviewData);
      
      toast.success('Thank you! Your review has been published.', 'Review Submitted');
      setComment('');
      setUserName('');
      setRating(5);
    } catch (error) {
      toast.error('Could not submit your review. Please try again.', 'Error');
      handleFirestoreError(error, OperationType.WRITE, reviewsPath);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t border-gray-100 pt-10" id="reviews-section">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <span>Customer Reviews</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            See what other buyers think or share your own experience
          </p>
        </div>

        {/* Overview Stats */}
        {reviewCount > 0 && (
          <div className="flex items-center space-x-4 bg-indigo-50/50 border border-indigo-100 px-5 py-3 rounded-2xl">
            <div className="text-center">
              <span className="block font-display font-extrabold text-3xl text-indigo-700">
                {averageRating}
              </span>
              <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
                out of 5
              </span>
            </div>
            <div className="h-8 w-px bg-indigo-100" />
            <div>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(parseFloat(averageRating))
                        ? 'fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 mt-1 block font-medium">
                Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Write a Review Form */}
        <div className="lg:col-span-5 bg-gray-50 border border-gray-100 rounded-3xl p-6">
          <h3 className="font-sans font-bold text-gray-900 text-lg mb-4">
            Write a Review
          </h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Your Rating
              </label>
              <div className="flex items-center space-x-1.5" id="rating-stars-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className="p-1 focus:outline-none transition-transform active:scale-90"
                    id={`star-input-${star}`}
                  >
                    <Star
                      className={`w-7 h-7 cursor-pointer transition-colors duration-150 ${
                        star <= (hoveredRating ?? rating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                id="review-name-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Review Comment
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your experience with this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 resize-none"
                id="review-comment-input"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-2xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
              id="submit-review-button"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : 'Submit Review'}</span>
            </button>
          </form>
        </div>

        {/* Existing Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-sans font-bold text-gray-900 text-lg mb-2">
            Recent Feedback
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-3xl text-center bg-gray-50/20">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-semibold text-sm">No reviews yet</p>
              <p className="text-gray-400 text-xs mt-1 max-w-xs">
                Be the first to review this product and share your thoughts with other customers!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1" id="reviews-list">
              <AnimatePresence initial={false}>
                {reviews.map((rev) => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block text-sm">
                            {rev.userName}
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating ? 'fill-current' : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mt-3.5 leading-relaxed whitespace-pre-wrap pl-1">
                      {rev.comment}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
