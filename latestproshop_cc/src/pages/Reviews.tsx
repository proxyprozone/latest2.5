import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowLeft, MessageSquare } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { db } from '../firebase';
import { collection, doc, onSnapshot, addDoc, updateDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function Reviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', customer_name: '', rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setSettings({});
      }
    });

    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubSettings();
      unsubReviews();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const q = query(collection(db, 'review_codes'), where('code', '==', formData.code), where('is_used', '==', false));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError(t('reviews.error.invalidcode') || 'Invalid or already used review code.');
        setIsSubmitting(false);
        return;
      }

      const codeDoc = querySnapshot.docs[0];

      await addDoc(collection(db, 'reviews'), {
        customer_name: formData.customer_name,
        rating: formData.rating,
        comment: formData.comment,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'review_codes', codeDoc.id), {
        is_used: true
      });
      
      setSuccess(t('reviews.success'));
      setFormData({ code: '', customer_name: '', rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
      setError(t('reviews.error.general'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-red-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-red-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-xl transition-colors font-medium border border-gray-800">
              <ArrowLeft size={20} />
              {t('reviews.back')}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-red-700">{t('reviews.title')}</h1>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Submit Review Form */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 sticky top-8">
              <h2 className="text-xl font-bold text-red-700 mb-6 flex items-center gap-2">
                <MessageSquare size={20} />
                {t('reviews.write')}
              </h2>
              
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
              {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{success}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">{t('reviews.form.code')}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="Enter code from admin"
                    className="w-full px-4 py-2 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-red-900"
                  />
                  <p className="text-xs text-red-500 mt-1">{t('reviews.form.code.desc')}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">{t('reviews.form.name')}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.customer_name}
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-red-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">{t('reviews.form.rating')}</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="focus:outline-none"
                      >
                        <Star 
                          size={24} 
                          className={star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-red-300"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">{t('reviews.form.comment')}</label>
                  <textarea 
                    required
                    value={formData.comment}
                    onChange={e => setFormData({...formData, comment: e.target.value})}
                    placeholder="Tell us what you think..."
                    rows={4}
                    className="w-full px-4 py-2 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none resize-none text-red-900"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 border border-gray-800"
                >
                  {isSubmitting ? t('reviews.form.submitting') : t('reviews.form.submit')}
                </button>
              </form>
            </div>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-red-700 mb-6">{t('reviews.recent')}</h2>
            
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-red-100">
                <MessageSquare size={48} className="mx-auto text-red-300 mb-4" />
                <p className="text-red-500">{t('reviews.noreviews')}</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-red-700">{review.customer_name}</div>
                    <div className="text-sm text-red-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={16} 
                        className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-red-300"} 
                      />
                    ))}
                  </div>
                  <p className="text-red-600 whitespace-pre-wrap">{review.comment}</p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
