import React, { useEffect, useState } from 'react';
import { ShoppingCart, ShoppingBag, X, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { db } from '../firebase';
import { collection, doc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Shop() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customerUpiId, setCustomerUpiId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setSettings({ site_title: 'My Shop', logo_url: '', bg_image_url: '' });
      }
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: any[] = [];
      snapshot.forEach(doc => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prods);
    });

    return () => {
      unsubSettings();
      unsubProducts();
    };
  }, []);

  const handleBuyClick = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (settings.upi_id || settings.qr_image_url) {
      setSelectedProduct(product);
      setOrderSuccess(false);
      setCustomerUpiId('');
      setCustomerEmail('');
    } else if (product.payment_link) {
      window.open(product.payment_link, '_blank');
    } else {
      window.open('https://checkout.pay4.work/pay/8225ce9ae788a702fa5b59717c8e3f81be3ec967c12083442f64affee27aa860', '_blank');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUpiId.trim() || !customerEmail.trim() || !selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        product_id: selectedProduct.id,
        product_title: selectedProduct.title,
        product_price: selectedProduct.price,
        customer_upi_id: customerUpiId,
        email: customerEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setOrderSuccess(true);
    } catch (err) {
      console.error('Failed to submit order', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    if (price.includes('₹')) return price;
    if (price.includes('$')) return price.replace('$', '₹');
    return `₹${price}`;
  };

  if (!settings) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-red-50 font-sans">
      {/* Hero Section with Background */}
      <div 
        className="relative h-80 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${settings.bg_image_url})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white flex flex-col items-center">
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="w-24 h-24 rounded-full border-4 border-white mb-4 object-cover" referrerPolicy="no-referrer" />
          )}
          <h1 className="text-5xl font-bold tracking-tight">{settings.site_title}</h1>
        </div>
      </div>

      {/* Products Grid */}
      <div 
        className="relative min-h-[calc(100vh-20rem)] bg-cover bg-center bg-fixed"
        style={settings.products_bg_image_url ? { backgroundImage: `url(${settings.products_bg_image_url})` } : {}}
      >
        {settings.products_bg_image_url && <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]"></div>}
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-red-700">{t('shop.title')}</h2>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link to="/about" className="text-sm font-medium text-white hover:text-gray-200 transition-colors px-4 py-2 bg-gray-900 hover:bg-gray-800 backdrop-blur-sm rounded-xl shadow-sm border border-gray-800">
                {t('nav.about')}
              </Link>
              <Link to="/reviews" className="text-sm font-medium text-white hover:text-gray-200 transition-colors px-4 py-2 bg-gray-900 hover:bg-gray-800 backdrop-blur-sm rounded-xl shadow-sm border border-gray-800">
                {t('nav.reviews')}
              </Link>
              <button className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors font-medium bg-gray-900 hover:bg-gray-800 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-800">
                <ShoppingBag size={20} />
                <span>{t('nav.cart')} (0)</span>
              </button>
              <Link to="/admin" className="p-2 bg-black hover:bg-gray-900 text-gray-400 hover:text-white rounded-full transition-colors shadow-sm border border-gray-800" title={t('nav.admin')}>
                <Bot size={18} />
              </Link>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center text-red-500 py-12">{t('shop.noproducts')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map(product => (
                <div key={product.id} className="bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-800 flex flex-col">
                  <div className="aspect-w-1 aspect-h-1 w-full bg-gray-800">
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="w-full h-64 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-white mb-2">{product.title}</h3>
                    <p className="text-xl font-bold text-emerald-600 mb-6">{formatPrice(product.price)}</p>
                    <div className="mt-auto">
                      <button 
                        onClick={(e) => handleBuyClick(product, e)}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors font-medium border border-green-600"
                      >
                        <ShoppingCart size={18} />
                        {t('shop.buynow')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50/50">
              <h3 className="text-xl font-bold text-red-700">{t('modal.title')}</h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {orderSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-red-700 mb-2">{t('modal.success.title')}</h4>
                  <p className="text-red-600 mb-8">
                    {t('modal.success.desc')}
                  </p>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors border border-green-600"
                  >
                    {t('modal.success.btn')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-4">
                    <img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="font-medium text-red-700">{selectedProduct.title}</div>
                      <div className="text-emerald-600 font-bold">{formatPrice(selectedProduct.price)}</div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="text-center space-y-4">
                    <p className="text-sm text-red-600">{t('modal.pay.desc')}</p>
                    
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium text-left leading-relaxed space-y-2">
                      <p>⚠️ <strong>Important:</strong> Please send the exact amount. If the paid amount does not match the product price, your payment will not be confirmed.</p>
                      <p>⚠️ <strong>Внимание:</strong> Пожалуйста, отправьте точную сумму. Если оплаченная сумма не совпадает с ценой товара, ваш платеж не будет подтвержден.</p>
                    </div>
                    
                    {settings.qr_image_url && (
                      <div className="flex justify-center">
                        <img src={settings.qr_image_url} alt="Payment QR Code" className="w-48 h-48 rounded-2xl border-2 border-red-100 shadow-sm" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    
                    {settings.upi_id && (
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 font-mono text-lg font-medium">
                        {settings.upi_id}
                      </div>
                    )}
                  </div>

                  {/* Confirmation Form */}
                  <form onSubmit={handlePaymentSubmit} className="pt-4 border-t border-red-100 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">
                        {t('modal.form.email')}
                      </label>
                      <input 
                        type="email" 
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g., yourname@gmail.com"
                        className="w-full px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all text-red-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">
                        {t('modal.form.upi')}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={customerUpiId}
                        onChange={(e) => setCustomerUpiId(e.target.value)}
                        placeholder="e.g., yourname@upi"
                        className="w-full px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all text-red-900"
                      />
                      <p className="text-xs text-red-500 mt-2">
                        {t('modal.form.upi.desc')}
                      </p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !customerUpiId.trim() || !customerEmail.trim()}
                      className="w-full bg-green-600 text-white py-3.5 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 border border-green-600"
                    >
                      {isSubmitting ? t('modal.form.submitting') : t('modal.form.submit')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
