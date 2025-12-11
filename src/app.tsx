import React, { useEffect, useMemo, useRef, useState } from "react";

// 型定義
type Coupon = {
  id: string;
  brand: string;
  face: number;
  needT: number;
  status: "redeemable" | "usable" | "used";
  icon?: string;
  desc?: string;
  products?: string[];
  code?: string;
  pin?: string;
  usedAt?: string;
  redeemedAt?: string;
};

type ApplicationStatus = "draft" | "submitted" | "reviewing" | "approved" | "monitoring";

type FormErrors = {
  [key: string]: string;
};

type Tx = { 
  id: string; 
  type: "redeem" | "use"; 
  label: string; 
  t?: number; 
  jpy?: number; 
  at: string 
};

type ApplyLog = { 
  id: string; 
  no: string; 
  at: string; 
  brand: string; 
  amountKg?: number; 
  startDate?: string;
  receiveDate?: string 
};

// フォーム型
type ApplyFormData = {
  // 個人情報
  name: string;
  nameKana: string;
  postalCode: string;
  address: string;
  birthDate: string;
  phone1: string;
  phone2: string;
  email: string;
  
  // 同意項目
  agreeMain: boolean;
  agreeDataProvision: boolean;
  agreeNotificationObligation: boolean;
  agreeFaultNotification: boolean;
  agreeTerminationConditions: boolean;
  agreePersonalInfo: boolean;
  
  // パワコン情報
  pcsVendor: string;
  pcsModel: string;
  pcsSerial: string;
  pcsQuantity: string;
  pcsRatedOutput: string;
  
  // 日付
  powerGenerationStartDate: string;
  powerReceptionStartDate: string;
  
  // 蓄電池
  hasBattery: "有" | "無";
  batteryVendor: string;
  batteryModel: string;
  batteryCapacity: string;
  batteryQuantity: string;
  batteryCertifiedCapacity: string;
  batteryEffectiveCapacity: string;
  
  // 補助金
  hasSubsidy: "有" | "無";
  subsidyName: string;
  subsidyProvider: string;
  
  // ファイル確認
  confirmPcsNameplate: boolean;
  confirmPowerContract: boolean;
  confirmBatteryNameplate: boolean;
  confirmSpecSheet: boolean;
  confirmFinalCheck: boolean;
};

const nowTime = () => new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
const rid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function DecoponMiniApp() {
  const [page, setPage] = useState<'home' | 'apply' | 'my' | 'coupon' | 'mycoupon'>('home');
  const [appStatus, setAppStatus] = useState<ApplicationStatus>('draft');
  const [showStatusDetail, setShowStatusDetail] = useState(false);
  
  // クーポン・クレジット関連
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: '1', brand: 'スターバックス', face: 500, needT: 0.5, status: 'redeemable', icon: '☕', desc: 'ドリンク全品に使用可能', products: ['コーヒー', 'フラペチーノ', 'ティー'] },
    { id: '2', brand: 'Amazon', face: 1000, needT: 1.0, status: 'redeemable', icon: '📦', desc: 'Amazon.co.jpでのお買い物に', products: ['書籍', '日用品', '電子機器'] },
    { id: '3', brand: 'Uber Eats', face: 800, needT: 0.8, status: 'redeemable', icon: '🍔', desc: '配達手数料込み', products: ['レストラン料理', 'ファストフード', 'コンビニ商品'] }
  ]);
  
  const [creditsT, setCreditsT] = useState(2.5);
  const [previewRedeem, setPreviewRedeem] = useState<Coupon | null>(null);
  const [confirmUse, setConfirmUse] = useState<Coupon | null>(null);
  const [showBarcode, setShowBarcode] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // トランザクション履歴
  const [txs, setTxs] = useState<Tx[]>([]);
  const [applyLogs, setApplyLogs] = useState<ApplyLog[]>([]);
  const [email, setEmail] = useState('');
  
  // フォーム関連
  const [formData, setFormData] = useState<ApplyFormData>({
    name: '', nameKana: '', postalCode: '', address: '', birthDate: '',
    phone1: '', phone2: '', email: '',
    agreeMain: false, agreeDataProvision: false, agreeNotificationObligation: false,
    agreeFaultNotification: false, agreeTerminationConditions: false, agreePersonalInfo: false,
    pcsVendor: '', pcsModel: '', pcsSerial: '', pcsQuantity: '', pcsRatedOutput: '',
    powerGenerationStartDate: '', powerReceptionStartDate: '',
    hasBattery: '無', batteryVendor: '', batteryModel: '', batteryCapacity: '',
    batteryQuantity: '', batteryCertifiedCapacity: '', batteryEffectiveCapacity: '',
    hasSubsidy: '無', subsidyName: '', subsidyProvider: '',
    confirmPcsNameplate: false, confirmPowerContract: false, confirmBatteryNameplate: false,
    confirmSpecSheet: false, confirmFinalCheck: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const onTx = (tx: Tx) => setTxs(prev => [tx, ...prev]);

  const acceptRedeem = (c: Coupon) => {
    if (creditsT < c.needT) { 
      setToast('❌ クレジット残高が不足しています'); 
      setTimeout(() => setToast(null), 2000);
      return; 
    }
    
    setCreditsT(t => Math.max(0, Math.round((t - c.needT) * 10) / 10));
    setCoupons(list => list.map(x => 
      x.id === c.id ? { 
        ...x, 
        status: 'usable', 
        code: `DC-${rid()}-${rid().slice(0, 4)}`,
        pin: String(1000 + Math.floor(Math.random() * 9000)),
        redeemedAt: new Date().toISOString()
      } : x
    ));
    
    onTx({ 
      id: rid(), 
      type: 'redeem',
      label: `${c.brand} ¥${c.face.toLocaleString()}`, 
      t: c.needT, 
      at: new Date().toISOString() 
    });
    
    setToast('✅ クーポンと交換しました');
    setTimeout(() => setToast(null), 2000);
  };

  const confirmSwipeComplete = (c: Coupon) => {
    setCoupons(list => list.map(x => 
      x.id === c.id ? { ...x, status: 'used', usedAt: new Date().toISOString() } : x
    ));
    
    onTx({ 
      id: rid(), 
      type: 'use', 
      label: `${c.brand} ¥${c.face.toLocaleString()}`, 
      jpy: c.face, 
      at: new Date().toISOString() 
    });
    
    setShowBarcode(c);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f9ff" fill-opacity="0.4"%3E%3Cpath d="M30 30c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12zm12 0c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      {/* Main Container */}
      <div className="relative max-w-md mx-auto bg-white/90 backdrop-blur-xl shadow-2xl shadow-emerald-100/50 min-h-screen border-x border-white/50">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🍊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">Decopon</h1>
                <p className="text-emerald-100 text-xs">カーボンクレジット・クーポン交換</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="bg-white/15 rounded-2xl px-4 py-2 backdrop-blur-sm border border-white/20">
                <p className="text-xs text-emerald-100">保有クレジット</p>
                <p className="text-2xl font-bold">{creditsT}<span className="text-sm ml-1">t</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-100">{nowTime()}</p>
                <p className="text-xs text-white/80">LINEミニアプリ</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {page === 'home' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
                  <div className="text-blue-600 text-2xl mb-1">📊</div>
                  <p className="text-xs text-blue-600 font-medium">今月の削減量</p>
                  <p className="text-lg font-bold text-blue-700">1.2t</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200/50">
                  <div className="text-green-600 text-2xl mb-1">🎁</div>
                  <p className="text-xs text-green-600 font-medium">取得クーポン</p>
                  <p className="text-lg font-bold text-green-700">{coupons.filter(c => c.status === 'usable').length}枚</p>
                </div>
              </div>

              {/* Action Cards */}
              <div className="space-y-4">
                <ActionCard
                  icon="🎟️"
                  title="クーポンと交換"
                  subtitle="クレジットを使ってお得なクーポンをゲット"
                  gradient="from-emerald-500 to-blue-500"
                  onClick={() => setPage('coupon')}
                />
                
                <ActionCard
                  icon="📱"
                  title="マイクーポン"
                  subtitle="取得済みクーポンの確認・使用"
                  gradient="from-blue-500 to-purple-500"
                  onClick={() => setPage('mycoupon')}
                />
                
                <ActionCard
                  icon="📝"
                  title="設備登録"
                  subtitle="太陽光発電設備の登録申請"
                  gradient="from-orange-500 to-red-500"
                  onClick={() => setPage('apply')}
                />
                
                <ActionCard
                  icon="👤"
                  title="マイページ"
                  subtitle="利用履歴・設定の確認"
                  gradient="from-purple-500 to-pink-500"
                  onClick={() => setPage('my')}
                />
              </div>
            </div>
          )}

          {page === 'coupon' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => setPage('home')}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-lg">←</span>
                </button>
                <h2 className="text-xl font-bold text-gray-800">クーポンと交換</h2>
              </div>
              
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200/50">
                <p className="text-sm text-emerald-700 font-medium">💡 クレジットでお得なクーポンと交換できます</p>
              </div>

              <CouponGrid 
                items={coupons.filter(c => c.status === 'redeemable')}
                mode="redeem"
                onPreviewRedeem={setPreviewRedeem}
                canRedeem={(c) => creditsT >= c.needT}
              />
            </div>
          )}

          {page === 'mycoupon' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => setPage('home')}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-lg">←</span>
                </button>
                <h2 className="text-xl font-bold text-gray-800">マイクーポン</h2>
              </div>

              <CouponGrid 
                items={coupons.filter(c => c.status === 'usable')}
                mode="usable"
                onUse={setConfirmUse}
              />
            </div>
          )}

          {page === 'apply' && (
            <ApplicationForm 
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              appStatus={appStatus}
              setAppStatus={setAppStatus}
              onBack={() => setPage('home')}
            />
          )}

          {page === 'my' && (
            <MyPage 
              txs={txs}
              applyLogs={applyLogs}
              email={email}
              setEmail={setEmail}
              onBack={() => setPage('home')}
            />
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white shadow-xl border border-gray-200 rounded-2xl px-6 py-3 animate-bounce-in">
              <p className="text-sm font-medium">{toast}</p>
            </div>
          </div>
        )}

        {/* Modals */}
        {previewRedeem && (
          <RedeemModal 
            coupon={previewRedeem}
            onClose={() => setPreviewRedeem(null)}
            onRedeem={(coupon) => {
              acceptRedeem(coupon);
              setPreviewRedeem(null);
            }}
          />
        )}

        {confirmUse && (
          <UseModal 
            coupon={confirmUse}
            onClose={() => setConfirmUse(null)}
            onUse={(coupon) => {
              confirmSwipeComplete(coupon);
              setConfirmUse(null);
            }}
          />
        )}

        {showBarcode && (
          <BarcodeModal 
            coupon={showBarcode}
            onClose={() => setShowBarcode(null)}
          />
        )}
      </div>
    </div>
  );
}

// -------------------- Components --------------------

const ActionCard: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  gradient: string;
  onClick: () => void;
}> = ({ icon, title, subtitle, gradient, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-6 bg-gradient-to-r ${gradient} rounded-2xl text-white text-left transition-all duration-300 hover:scale-105 hover:shadow-xl group relative overflow-hidden`}
  >
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="relative">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{subtitle}</p>
    </div>
  </button>
);

const CouponGrid: React.FC<{
  items: Coupon[];
  mode: 'usable' | 'redeem';
  onUse?: (c: Coupon) => void;
  onPreviewRedeem?: (c: Coupon) => void;
  canRedeem?: (c: Coupon) => boolean;
}> = ({ items, mode, onUse, onPreviewRedeem, canRedeem }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎁</div>
        <p className="text-gray-500 font-medium">
          {mode === 'usable' ? '利用可能なクーポンがありません' : 'クーポンがありません'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map(c => {
        if (mode === 'redeem') {
          const disabled = canRedeem ? !canRedeem(c) : false;
          return (
            <button
              key={c.id}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                  : 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50 hover:border-emerald-300 hover:shadow-lg active:scale-95'
              }`}
              onClick={() => { if (!disabled && onPreviewRedeem) onPreviewRedeem(c); }}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{c.icon || '🎟️'}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{c.brand}</h3>
                  <p className="text-2xl font-black text-emerald-600">¥{c.face.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">必要: {c.needT}t</p>
                </div>
              </div>
            </button>
          );
        }

        return (
          <div key={c.id} className="p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{c.icon || '🎟️'}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{c.brand}</h3>
                <p className="text-2xl font-black text-green-600">¥{c.face.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={() => onUse && onUse(c)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 active:scale-95"
            >
              使用する
            </button>
          </div>
        );
      })}
    </div>
  );
};

// -------------------- Application Form --------------------
const ApplicationForm: React.FC<{
  formData: ApplyFormData;
  setFormData: (data: ApplyFormData) => void;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  appStatus: ApplicationStatus;
  setAppStatus: (status: ApplicationStatus) => void;
  onBack: () => void;
}> = ({ formData, setFormData, errors, setErrors, appStatus, setAppStatus, onBack }) => {
  
  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) newErrors.name = '名前を入力してください';
    if (!formData.nameKana.trim()) newErrors.nameKana = 'フリガナを入力してください';
    if (!formData.email.trim()) newErrors.email = 'メールアドレスを入力してください';
    if (!formData.agreeMain) newErrors.agreeMain = '基本契約への同意が必要です';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setAppStatus('submitted');
    }
  };

  if (appStatus !== 'draft') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">
          {appStatus === 'submitted' && '📤'}
          {appStatus === 'reviewing' && '🔍'}
          {appStatus === 'approved' && '✅'}
          {appStatus === 'monitoring' && '📊'}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {appStatus === 'submitted' && '申請送信完了'}
          {appStatus === 'reviewing' && '審査中'}
          {appStatus === 'approved' && '承認済み'}
          {appStatus === 'monitoring' && '監視中'}
        </h2>
        <p className="text-gray-600 mb-6">
          {appStatus === 'submitted' && '申請が正常に送信されました'}
          {appStatus === 'reviewing' && '申請内容を審査しています'}
          {appStatus === 'approved' && '設備登録が完了しました'}
          {appStatus === 'monitoring' && '発電量を監視しています'}
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-medium"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <span className="text-lg">←</span>
        </button>
        <h2 className="text-xl font-bold text-gray-800">設備登録申請</h2>
      </div>

      <div className="space-y-6">
        <FormSection title="基本情報">
          <TextInput 
            label="お名前" 
            value={formData.name} 
            onChange={(v) => setFormData({...formData, name: v})}
            required
            error={errors.name}
            field="name"
            onClearError={clearError}
          />
          <TextInput 
            label="フリガナ" 
            value={formData.nameKana} 
            onChange={(v) => setFormData({...formData, nameKana: v})}
            required
            error={errors.nameKana}
            field="nameKana"
            onClearError={clearError}
          />
          <TextInput 
            label="メールアドレス" 
            value={formData.email} 
            onChange={(v) => setFormData({...formData, email: v})}
            type="email"
            required
            error={errors.email}
            field="email"
            onClearError={clearError}
          />
        </FormSection>

        <FormSection title="同意事項">
          <CheckboxField
            label="基本契約に同意する"
            checked={formData.agreeMain}
            onChange={(checked) => setFormData({...formData, agreeMain: checked})}
            required
            error={errors.agreeMain}
            field="agreeMain"
            onClearError={clearError}
          />
        </FormSection>

        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 active:scale-95"
        >
          申請を送信
        </button>
      </div>
    </div>
  );
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const TextInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  field?: string;
  onClearError?: (field: string) => void;
}> = ({ label, value, onChange, type = "text", required, error, field, onClearError }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => {
        onChange(e.target.value);
        if (field && onClearError) onClearError(field);
      }}
      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
        error ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
    />
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">!</span>
        {error}
      </p>
    )}
  </div>
);

const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  field?: string;
  onClearError?: (field: string) => void;
}> = ({ label, checked, onChange, required, error, field, onClearError }) => (
  <div>
    <label className="flex items-start gap-3 cursor-pointer group">
      <input 
        type="checkbox"
        checked={checked}
        onChange={e => {
          onChange(e.target.checked);
          if (field && onClearError) onClearError(field);
        }}
        className={`mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-all ${
          error ? 'border-red-500' : ''
        }`}
      />
      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">!</span>
        {error}
      </p>
    )}
  </div>
);

// -------------------- My Page --------------------
const MyPage: React.FC<{
  txs: Tx[];
  applyLogs: ApplyLog[];
  email: string;
  setEmail: (email: string) => void;
  onBack: () => void;
}> = ({ txs, applyLogs, email, setEmail, onBack }) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <button 
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
      >
        <span className="text-lg">←</span>
      </button>
      <h2 className="text-xl font-bold text-gray-800">マイページ</h2>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">利用履歴</h3>
        {txs.length === 0 ? (
          <p className="text-center py-8 text-gray-500">履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {txs.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">{tx.label}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.at).toLocaleString('ja-JP')}</p>
                </div>
                <span className={`font-bold ${tx.type === 'redeem' ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.type === 'redeem' ? `-${tx.t}t` : `¥${tx.jpy?.toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// -------------------- Modals --------------------
const Sheet: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
    <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up border-t border-gray-200 max-h-[80vh] overflow-y-auto">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
      {children}
    </div>
  </div>
);

const RedeemModal: React.FC<{ coupon: Coupon; onClose: () => void; onRedeem: (coupon: Coupon) => void }> = ({ coupon, onClose, onRedeem }) => (
  <Sheet onClose={onClose}>
    <div className="text-center">
      <div className="text-6xl mb-4">{coupon.icon || '🎟️'}</div>
      <h2 className="text-2xl font-bold mb-2">{coupon.brand}</h2>
      <p className="text-3xl font-black text-emerald-600 mb-4">
        ¥{coupon.face.toLocaleString()}
      </p>
      <p className="text-gray-600 mb-6">
        必要クレジット：{coupon.needT}t
      </p>
      
      {coupon.desc && (
        <div className="p-4 bg-gray-50 rounded-xl mb-6">
          <p className="text-sm text-gray-700">{coupon.desc}</p>
        </div>
      )}
      
      <SwipeToConfirm variant="redeem" onComplete={() => onRedeem(coupon)}>
        スワイプして引き換える
      </SwipeToConfirm>
    </div>
  </Sheet>
);

const UseModal: React.FC<{ coupon: Coupon; onClose: () => void; onUse: (coupon: Coupon) => void }> = ({ coupon, onClose, onUse }) => (
  <Sheet onClose={onClose}>
    <div className="text-center">
      <div className="text-6xl mb-4">{coupon.icon || '🎟️'}</div>
      <h2 className="text-2xl font-bold mb-2">{coupon.brand}</h2>
      <p className="text-3xl font-black text-green-600 mb-6">
        ¥{coupon.face.toLocaleString()}
      </p>
      
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
        <p className="text-sm text-amber-800">⚠️ 一度バーコードを表示すると取り消せません</p>
      </div>
      
      <SwipeToConfirm variant="use" onComplete={() => onUse(coupon)}>
        スワイプして使用
      </SwipeToConfirm>
    </div>
  </Sheet>
);

const BarcodeModal: React.FC<{ coupon: Coupon; onClose: () => void }> = ({ coupon, onClose }) => (
  <Sheet onClose={onClose}>
    <div className="text-center">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{coupon.brand}</h2>
        <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
          1回限り
        </span>
      </div>
      
      <div className="space-y-6">
        <FakeBarcode seed={coupon.code || 'DEFAULT'} />
        
        {coupon.code && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">クーポンコード</p>
            <p className="font-mono text-lg font-bold">{coupon.code}</p>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  </Sheet>
);

// -------------------- Helper Components --------------------
const FakeBarcode: React.FC<{ seed: string }> = ({ seed }) => {
  const bars = useMemo(() => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) { 
      h ^= seed.charCodeAt(i); 
      h = Math.imul(h, 16777619) >>> 0; 
    }
    const arr: number[] = [];
    for (let i = 0; i < 80; i++) { 
      h ^= h << 13; 
      h ^= h >>> 17; 
      h ^= h << 5; 
      arr.push((h % 4) + 1); 
    }
    return arr;
  }, [seed]);

  return (
    <div className="bg-white border-2 border-gray-300 p-6 rounded-2xl shadow-lg mx-auto w-fit">
      <div className="h-24 w-64 bg-white flex items-stretch mb-3">
        {bars.map((w, i) => (
          <div 
            key={i} 
            style={{ width: w }} 
            className={i % 2 === 0 ? 'bg-black' : 'bg-white'} 
          />
        ))}
      </div>
      <div className="text-center text-xs font-mono tracking-widest text-gray-600">
        {seed}
      </div>
    </div>
  );
};

const SwipeToConfirm: React.FC<React.PropsWithChildren<{ onComplete: () => void; variant?: "redeem" | "use" }>> = ({ children, onComplete, variant = "redeem" }) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const colors = {
    redeem: {
      bg: 'bg-emerald-100',
      track: 'bg-emerald-400',
      thumb: 'bg-emerald-600',
      text: 'text-emerald-700',
      completeBg: 'bg-green-400',
      completeText: 'text-white'
    },
    use: {
      bg: 'bg-orange-100', 
      track: 'bg-orange-400',
      thumb: 'bg-orange-600',
      text: 'text-orange-700',
      completeBg: 'bg-green-400',
      completeText: 'text-white'
    }
  };

  const theme = colors[variant];

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted) return;
    e.preventDefault();
    setIsDragging(true);
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const base = trackRef.current?.getBoundingClientRect();
    if (!base) return;

    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const dx = Math.max(0, Math.min(base.width - 56, x - startX)); // 56 = thumb width
      const newProgress = Math.round((dx / (base.width - 56)) * 100);
      setProgress(newProgress);
      
      // Haptic feedback when nearing completion
      if (newProgress > 85 && progress <= 85 && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      
      if (progress > 85) {
        setIsCompleted(true);
        setProgress(100);
        
        // Success haptic
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }
        
        setTimeout(() => {
          onComplete();
        }, 300);
      } else {
        // Smooth return animation
        const returnAnimation = () => {
          setProgress(prev => {
            const newProgress = prev - 8;
            if (newProgress <= 0) {
              return 0;
            }
            requestAnimationFrame(returnAnimation);
            return newProgress;
          });
        };
        requestAnimationFrame(returnAnimation);
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  return (
    <div className="select-none">
      <div 
        ref={trackRef}
        className={`h-16 w-full rounded-2xl ${theme.bg} border-2 border-gray-200 relative overflow-hidden shadow-inner ${!isCompleted ? 'cursor-pointer' : ''}`}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Progress track */}
        <div 
          className={`absolute inset-y-1 left-1 right-1 rounded-xl transition-all duration-300 ${
            isCompleted ? theme.completeBg : progress > 0 ? theme.track : 'bg-transparent'
          }`}
          style={{ 
            width: `${progress}%`,
            maxWidth: 'calc(100% - 8px)'
          }}
        />
        
        {/* Thumb */}
        <div 
          className={`absolute top-1 left-1 w-14 h-14 rounded-xl ${theme.thumb} shadow-lg flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'scale-105' : ''
          }`}
          style={{ 
            transform: `translateX(${Math.min(progress * 2.5, 100)}%)`,
            backgroundColor: isCompleted ? '#10b981' : undefined
          }}
        >
          <span className="text-white text-xl">
            {isCompleted ? '✓' : '→'}
          </span>
        </div>
        
        {/* Text */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
          isCompleted ? theme.completeText : theme.text
        }`}>
          <span className="font-medium text-sm">
            {isCompleted ? '完了!' : children}
          </span>
        </div>
      </div>
    </div>
  );
};