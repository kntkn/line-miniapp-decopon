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
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <IphoneFrame>
        <LineTalkRoom />
      </IphoneFrame>
    </div>
  );
}

// -------------------- iPhone Frame --------------------
const IphoneFrame: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-[48px] shadow-2xl shadow-gray-900/50 transform hover:scale-[1.01] transition-all duration-500" 
       style={{ width: 390, height: 844 }}>
    {/* Dynamic Island */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-3 w-[126px] h-[30px] bg-black rounded-b-3xl z-20 shadow-inner" />
    
    {/* Screen */}
    <div className="absolute inset-[12px] bg-white rounded-[36px] overflow-hidden shadow-inner">
      {children}
    </div>
    
    {/* Side buttons with better styling */}
    <div className="absolute left-[-3px] top-[140px] w-[6px] h-[60px] bg-gradient-to-r from-gray-700 to-gray-600 rounded-r-md shadow-md" />
    <div className="absolute right-[-3px] top-[180px] w-[6px] h-[50px] bg-gradient-to-l from-gray-700 to-gray-600 rounded-l-md shadow-md" />
    <div className="absolute right-[-3px] top-[240px] w-[6px] h-[50px] bg-gradient-to-l from-gray-700 to-gray-600 rounded-l-md shadow-md" />
  </div>
);

// -------------------- Talk Room --------------------
function LineTalkRoom() {
  type Msg = { id: string; from: "bot" | "user"; text: string; time: string };

  const [msgs, setMsgs] = useState<Msg[]>([
    { id: rid(), from: "bot", text: "Decoponミニアプリへようこそ✨\n環境価値をクーポンに変えて、エコな生活をはじめましょう！", time: nowTime() },
  ]);
  const [input, setInput] = useState("");
  const [overlay, setOverlay] = useState<null | { screen: "main" | "mypage"; tab?: "apply" | "credits" }>(null);
  const scRef = useRef<HTMLDivElement>(null);

  // 共有状態
  const [txs, setTxs] = useState<Tx[]>([]);
  const [applyLogs, setApplyLogs] = useState<ApplyLog[]>([]);
  const [email, setEmail] = useState<string>("");

  useEffect(() => { 
    scRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); 
  }, [msgs.length]);

  const pushBot = (text: string) => setMsgs(m => [...m, { id: rid(), from: "bot", text, time: nowTime() }]);
  const pushUser = (text: string) => setMsgs(m => [...m, { id: rid(), from: "user", text, time: nowTime() }]);

  return (
    <div className="flex flex-col h-full select-none relative">
      {/* Status bar gap */}
      <div className="h-6" />

      {/* Header */}
      <div className="h-12 border-b border-gray-100 px-4 flex items-center gap-3 bg-gradient-to-r from-white to-gray-50 backdrop-blur-sm">
        <button className="text-2xl text-gray-600 hover:text-gray-800 hover:scale-110 transition-all duration-200">‹</button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-lg shadow-lg">
          🍊
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-bold flex items-center gap-2 text-gray-800">
            Decopon（公式）
            <span className="text-emerald-500 text-base">✓</span>
          </div>
          <div className="text-xs text-gray-500">応答: 通常2〜3営業日</div>
        </div>
        <button className="text-xl text-gray-600 hover:text-gray-800 hover:scale-110 transition-all duration-200">⋯</button>
      </div>

      {/* Messages */}
      <div ref={scRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 to-indigo-50 px-3 py-3">
        <div className="text-center text-xs text-gray-500 my-3 bg-white/70 rounded-full px-4 py-2 inline-block mx-auto shadow-sm">
          今日
        </div>
        {msgs.map(m => m.from === "bot" ? (
          <div key={m.id} className="flex items-end gap-3 my-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white text-sm flex items-center justify-center shadow-lg">
              🍊
            </div>
            <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-md px-4 py-3 text-sm shadow-lg border border-white/50">
              <div className="whitespace-pre-line text-gray-800">{m.text}</div>
            </div>
            <div className="text-xs text-gray-400 self-end">{m.time}</div>
          </div>
        ) : (
          <div key={m.id} className="flex justify-end items-end gap-3 my-4">
            <div className="text-xs text-gray-400 self-end">{m.time}</div>
            <div className="max-w-[70%] bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl rounded-tr-md px-4 py-3 text-sm shadow-lg text-white">
              <div>{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rich Menu - enhanced styling */}
      <RichMenu3
        onApply={() => { pushUser("申請する"); setOverlay({ screen: "main", tab: "apply" }); }}
        onCredits={() => { pushUser("保有クレジット"); setOverlay({ screen: "main", tab: "credits" }); }}
        onMy={() => { pushUser("マイページ"); setOverlay({ screen: "mypage" }); }}
      />

      {/* Message Input */}
      <div className="bg-white px-3 py-3 border-t border-gray-100 flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:scale-110 transition-all duration-200 shadow-sm">
          ＋
        </button>
        <div className="flex-1">
          <input 
            value={input} 
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && input.trim() && (pushUser(input.trim()), setInput(""), pushBot("下のメニューから操作を選んでください。"))}
            placeholder="メッセージを入力" 
            className="w-full h-10 rounded-full bg-gray-100 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all duration-200 placeholder-gray-500" 
          />
        </div>
        <button 
          onClick={()=>{ 
            if(!input.trim()) return; 
            pushUser(input.trim()); 
            setInput(""); 
            pushBot("下のメニューから操作を選んでください。"); 
          }} 
          className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white text-sm active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          →
        </button>
      </div>

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/50 z-50 flex flex-col min-h-0 backdrop-blur-sm">
          <div className="h-6" />
          <div className="h-12 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
            <div className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Decopon ミニアプリ
            </div>
            <button 
              onClick={()=>setOverlay(null)} 
              className="text-lg hover:scale-110 transition-all duration-200 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-gradient-to-b from-white to-gray-50">
            {overlay.screen === "main" ? (
              <MainOnePage
                initialTab={overlay.tab ?? 'apply'}
                txs={txs}
                onTx={(t)=>setTxs(prev=>[t,...prev])}
                onApply={(log)=>setApplyLogs(prev=>[log,...prev])}
              />
            ) : (
              <MyPage
                txs={txs}
                applyLogs={applyLogs}
                email={email}
                setEmail={setEmail}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------- Rich Menu --------------------
function RichMenu3({ onApply, onCredits, onMy }: { 
  onApply: () => void; 
  onCredits: () => void; 
  onMy: () => void; 
}) {
  return (
    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-t border-orange-100" style={{ height: 280 }}>
      <div className="p-4 grid grid-cols-2 grid-rows-2 gap-4 h-full">
        {/* 申請ボタン（左側大きく） */}
        <button 
          onClick={onApply} 
          className="row-span-2 rounded-3xl bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 relative active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center gap-3 shadow-xl hover:shadow-2xl text-white group overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          
          <div className="text-5xl animate-pulse group-hover:animate-bounce">⚡</div>
          <div className="text-base font-bold tracking-wide">申請する</div>
          <div className="text-xs opacity-90 text-center leading-tight">Jクレジット申請</div>
          <div className="absolute top-4 right-4 w-4 h-4 bg-white/20 rounded rotate-45 animate-pulse" />
        </button>

        {/* 保有クレジット */}
        <button 
          onClick={onCredits} 
          className="rounded-2xl bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 relative active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-xl hover:shadow-2xl text-white group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -translate-y-4 translate-x-4" />
          
          <div className="text-3xl group-hover:animate-pulse">💰</div>
          <div className="text-xs font-semibold text-center leading-tight">保有クレジット</div>
          <div className="absolute top-3 right-3 w-2 h-2 bg-white/30 rounded rotate-45" />
        </button>

        {/* マイページ */}
        <button 
          onClick={onMy} 
          className="rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600 relative active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-xl hover:shadow-2xl text-white group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -translate-y-4 translate-x-4" />
          
          <div className="text-3xl group-hover:animate-pulse">👤</div>
          <div className="text-xs font-semibold">マイページ</div>
          <div className="absolute top-3 right-3 w-2 h-2 bg-white/30 rounded rotate-45" />
        </button>
      </div>
    </div>
  );
}

// -------------------- Main One Page --------------------
function MainOnePage({ 
  initialTab, 
  onTx, 
  onApply 
}: { 
  initialTab: string; 
  txs: Tx[]; 
  onTx: (tx: Tx) => void; 
  onApply: (log: ApplyLog) => void; 
}) {
  const [tab, setTab] = useState<"apply" | "credits">(initialTab as any || "apply");
  const [appStatus, setAppStatus] = useState<ApplicationStatus>("draft");
  const [showStatusDetail, setShowStatusDetail] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white">
        {[
          { key: "apply", label: "📝 申請", color: "emerald" },
          { key: "credits", label: "🎁 クーポン", color: "blue" }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 py-4 px-2 text-sm font-medium transition-all duration-200 ${
              tab === key 
                ? `text-${color}-600 border-b-2 border-${color}-500 bg-${color}-50` 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "apply" ? (
          <ApplicationPage 
            appStatus={appStatus}
            setAppStatus={setAppStatus}
            showStatusDetail={showStatusDetail}
            setShowStatusDetail={setShowStatusDetail}
            onApply={onApply}
          />
        ) : (
          <CreditsView onTx={onTx} />
        )}
      </div>
    </div>
  );
}

// -------------------- Application Page --------------------
function ApplicationPage({ 
  appStatus, 
  setAppStatus, 
  showStatusDetail, 
  setShowStatusDetail,
  onApply 
}: { 
  appStatus: ApplicationStatus; 
  setAppStatus: (s: ApplicationStatus) => void; 
  showStatusDetail: boolean;
  setShowStatusDetail: (s: boolean) => void;
  onApply: (log: ApplyLog) => void; 
}) {
  const [formData, setFormData] = useState<ApplyFormData>({
    name: "", nameKana: "", postalCode: "", address: "", birthDate: "",
    phone1: "", phone2: "", email: "",
    agreeMain: false, agreeDataProvision: false, agreeNotificationObligation: false,
    agreeFaultNotification: false, agreeTerminationConditions: false, agreePersonalInfo: false,
    pcsVendor: "", pcsModel: "", pcsSerial: "", pcsQuantity: "", pcsRatedOutput: "",
    powerGenerationStartDate: "", powerReceptionStartDate: "",
    hasBattery: "無", batteryVendor: "", batteryModel: "", batteryCapacity: "",
    batteryQuantity: "", batteryCertifiedCapacity: "", batteryEffectiveCapacity: "",
    hasSubsidy: "無", subsidyName: "", subsidyProvider: "",
    confirmPcsNameplate: false, confirmPowerContract: false, confirmBatteryNameplate: false,
    confirmSpecSheet: false, confirmFinalCheck: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

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
      setAppStatus("submitted");
      onApply({
        id: rid(),
        no: `APP-${rid()}`,
        at: new Date().toISOString(),
        brand: "太陽光発電設備",
        amountKg: 1200,
        startDate: formData.powerGenerationStartDate,
        receiveDate: formData.powerReceptionStartDate
      });
    }
  };

  const statusConfigs: Record<ApplicationStatus, { icon: string; title: string; desc: string; color: string; bg: string }> = {
    draft: { icon: "📝", title: "下書き", desc: "申請書を作成してください", color: "gray-600", bg: "gray-50" },
    submitted: { icon: "📤", title: "申請送信完了", desc: "申請が正常に送信されました", color: "blue-600", bg: "blue-50" },
    reviewing: { icon: "🔍", title: "審査中", desc: "申請内容を審査しています", color: "yellow-600", bg: "yellow-50" },
    approved: { icon: "✅", title: "承認済み", desc: "設備登録が完了しました", color: "green-600", bg: "green-50" },
    monitoring: { icon: "📊", title: "監視中", desc: "発電量を監視しています", color: "purple-600", bg: "purple-50" }
  };

  const config = statusConfigs[appStatus];

  if (appStatus !== "draft") {
    return (
      <div className="p-6 text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${config.bg} mb-6`}>
          <span className="text-4xl">{config.icon}</span>
        </div>
        <h2 className={`text-xl font-bold mb-2 text-${config.color}`}>{config.title}</h2>
        <p className="text-gray-600 mb-6">{config.desc}</p>
        
        <button
          onClick={() => setShowStatusDetail(!showStatusDetail)}
          className={`mb-4 px-6 py-2 rounded-full bg-${config.bg} text-${config.color} text-sm font-medium hover:opacity-80 transition-opacity`}
        >
          詳細を見る
        </button>
        
        {showStatusDetail && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 text-left">
            <h3 className="font-semibold mb-2">申請詳細</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>申請番号: APP-{rid()}</div>
              <div>申請日時: {new Date().toLocaleDateString('ja-JP')}</div>
              <div>種別: 太陽光発電設備</div>
              <div>予想削減量: 1.2t CO₂/年</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">設備登録申請</h1>
        <p className="text-gray-600">Jクレジット申請フォーム</p>
      </div>

      {/* Form */}
      <Card title="基本情報">
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
      </Card>

      <Card title="同意事項">
        <CheckboxField
          label="基本契約に同意する"
          checked={formData.agreeMain}
          onChange={(checked) => setFormData({...formData, agreeMain: checked})}
          required
          error={errors.agreeMain}
          field="agreeMain"
          onClearError={clearError}
        />
      </Card>

      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 active:scale-[0.98] shadow-lg"
      >
        申請を送信
      </button>
    </div>
  );
}

// -------------------- Credits View --------------------
function CreditsView({ onTx }: { onTx: (tx: Tx) => void }) {
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: '1', brand: 'スターバックス', face: 500, needT: 0.5, status: 'redeemable', icon: '☕', desc: 'ドリンク全品に使用可能' },
    { id: '2', brand: 'Amazon', face: 1000, needT: 1.0, status: 'redeemable', icon: '📦', desc: 'Amazon.co.jpでのお買い物に' },
    { id: '3', brand: 'Uber Eats', face: 800, needT: 0.8, status: 'redeemable', icon: '🍔', desc: '配達手数料込み' }
  ]);
  
  const [creditsT, setCreditsT] = useState(2.5);
  const [previewRedeem, setPreviewRedeem] = useState<Coupon | null>(null);
  const [confirmUse, setConfirmUse] = useState<Coupon | null>(null);
  const [showBarcode, setShowBarcode] = useState<Coupon | null>(null);

  const acceptRedeem = (c: Coupon) => {
    if (creditsT < c.needT) { 
      alert('❌ クレジット残高が不足しています'); 
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
    <div className="p-6 space-y-6">
      {/* Credits Header */}
      <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
        <div className="text-emerald-600 text-4xl mb-2">🌱</div>
        <h2 className="text-lg font-bold text-emerald-800 mb-1">保有クレジット</h2>
        <div className="text-3xl font-black text-emerald-600">{creditsT}<span className="text-lg ml-1">t</span></div>
        <p className="text-sm text-emerald-700 mt-2">CO₂削減量</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button className="flex-1 py-3 text-sm font-medium bg-white rounded-lg shadow-sm text-gray-800">
          🎟️ クーポン交換
        </button>
        <button 
          onClick={() => window.location.hash = '#mycoupon'}
          className="flex-1 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          📱 マイクーポン
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="space-y-4">
        {coupons.filter(c => c.status === 'redeemable').map(c => {
          const disabled = creditsT < c.needT;
          return (
            <button
              key={c.id}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                  : 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50 hover:border-emerald-300 hover:shadow-lg active:scale-[0.98]'
              }`}
              onClick={() => { if (!disabled) setPreviewRedeem(c); }}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{c.icon || '🎟️'}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{c.brand}</h3>
                  <p className="text-xl font-black text-emerald-600">¥{c.face.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">必要: {c.needT}t</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

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
  );
}

// -------------------- My Page --------------------
function MyPage({ txs }: { 
  txs: Tx[]; 
  applyLogs: ApplyLog[]; 
  email: string; 
  setEmail: (email: string) => void; 
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">マイページ</h1>
        <p className="text-gray-600">利用履歴・設定の確認</p>
      </div>

      <Card title="利用履歴">
        {txs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>まだ履歴がありません</p>
          </div>
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
      </Card>
    </div>
  );
}

// -------------------- Helper Components --------------------
const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
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

// -------------------- Modals --------------------
const RedeemModal: React.FC<{ coupon: Coupon; onClose: () => void; onRedeem: (coupon: Coupon) => void }> = ({ coupon, onRedeem }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
    <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up border-t border-gray-200 max-h-[80vh] overflow-y-auto">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
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
    </div>
  </div>
);

const UseModal: React.FC<{ coupon: Coupon; onClose: () => void; onUse: (coupon: Coupon) => void }> = ({ coupon, onUse }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
    <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up border-t border-gray-200 max-h-[80vh] overflow-y-auto">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
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
    </div>
  </div>
);

const BarcodeModal: React.FC<{ coupon: Coupon; onClose: () => void }> = ({ coupon, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
    <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up border-t border-gray-200 max-h-[80vh] overflow-y-auto">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
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
    </div>
  </div>
);

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