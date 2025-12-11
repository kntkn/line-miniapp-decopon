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
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-6">
      <IphoneFrame>
        <LineTalkRoom />
      </IphoneFrame>
    </div>
  );
}

// -------------------- iPhone Frame --------------------
const IphoneFrame: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="relative bg-black rounded-[48px] shadow-2xl transform hover:scale-[1.02] transition-transform duration-300" 
       style={{ width: 390, height: 844 }}>
    {/* Dynamic Island */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 w-[126px] h-[35px] bg-black rounded-b-3xl z-20" />
    
    {/* Screen */}
    <div className="absolute inset-[10px] bg-white rounded-[38px] overflow-hidden">
      {children}
    </div>
    
    {/* Volume buttons */}
    <div className="absolute left-[-2px] top-[140px] w-1 h-16 bg-black/60 rounded" />
    <div className="absolute right-[-2px] top-[200px] w-1 h-24 bg-black/60 rounded" />
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
      <div className="h-12 border-b border-neutral-200 px-3 flex items-center gap-2 bg-white/80 backdrop-blur-sm">
        <button className="text-2xl leading-none hover:scale-110 transition-transform">‹</button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm shadow-lg">
          🌱
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-semibold flex items-center gap-1">
            Decopon（公式）
            <span className="text-emerald-600">✓</span>
          </div>
          <div className="text-[11px] text-neutral-500">応答: 通常2〜3営業日</div>
        </div>
        <button className="text-xl hover:scale-110 transition-transform">⋯</button>
      </div>

      {/* Messages */}
      <div ref={scRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-[#F0F7FF] to-[#E5F3FF] px-2 py-2">
        <div className="text-center text-[11px] text-neutral-500 my-2 bg-white/50 rounded-full px-3 py-1 inline-block mx-auto">
          今日
        </div>
        {msgs.map(m => m.from === "bot" ? (
          <div key={m.id} className="flex items-end gap-2 my-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-[11px] flex items-center justify-center shadow-lg">
              🌱
            </div>
            <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-[15px] shadow-sm border border-white/50">
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
            <div className="text-[10px] text-neutral-500 self-end">{m.time}</div>
          </div>
        ) : (
          <div key={m.id} className="flex justify-end items-end gap-2 my-3">
            <div className="text-[10px] text-neutral-500 self-end">{m.time}</div>
            <div className="max-w-[70%] bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl rounded-tr-sm px-3 py-2 text-[15px] shadow-sm text-white">
              <div>{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rich Menu */}
      <RichMenu3
        onApply={() => { pushUser("申請する"); setOverlay({ screen: "main", tab: "apply" }); }}
        onCredits={() => { pushUser("保有クレジット"); setOverlay({ screen: "main", tab: "credits" }); }}
        onMy={() => { pushUser("マイページ"); setOverlay({ screen: "mypage" }); }}
      />

      {/* Message Input */}
      <div className="bg-white px-2 py-2 border-t border-neutral-200 flex items-center gap-2">
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-600 hover:scale-110 transition-transform">
          ＋
        </button>
        <div className="flex-1">
          <input 
            value={input} 
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && input.trim() && (pushUser(input.trim()), setInput(""), pushBot("下のメニューから操作を選んでください。"))}
            placeholder="メッセージを入力" 
            className="w-full h-10 rounded-full bg-neutral-100 px-4 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300 transition-all" 
          />
        </div>
        <button 
          onClick={()=>{ 
            if(!input.trim()) return; 
            pushUser(input.trim()); 
            setInput(""); 
            pushBot("下のメニューから操作を選んでください。"); 
          }} 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm active:scale-95 transition-transform shadow-lg hover:shadow-xl"
        >
          →
        </button>
      </div>

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col min-h-0 backdrop-blur-sm">
          <div className="h-6" />
          <div className="h-12 bg-white/90 backdrop-blur-sm border-b border-neutral-200 px-3 flex items-center justify-between">
            <div className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Decopon ミニアプリ
            </div>
            <button 
              onClick={()=>setOverlay(null)} 
              className="text-xl hover:scale-110 transition-transform bg-neutral-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-gradient-to-b from-white to-neutral-50">
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
    <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-t border-neutral-200" style={{ height: 280 }}>
      <div className="p-3 grid grid-cols-2 grid-rows-2 gap-3 h-full">
        {/* 申請ボタン（左側大きく） */}
        <button 
          onClick={onApply} 
          className="row-span-2 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 relative active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl text-white"
        >
          <div className="text-[40px] animate-pulse">⚡</div>
          <div className="text-[14px] font-bold tracking-wide">申請する</div>
          <div className="text-[10px] opacity-80">Jクレジット申請</div>
          <div className="absolute top-3 right-3 w-3 h-3 bg-white/30 rounded rotate-45 animate-pulse" />
        </button>

        {/* 保有クレジット */}
        <button 
          onClick={onCredits} 
          className="rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-600 relative active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl text-white"
        >
          <div className="text-[28px]">💰</div>
          <div className="text-[11px] font-medium">保有クレジット</div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded rotate-45" />
        </button>

        {/* マイページ */}
        <button 
          onClick={onMy} 
          className="rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 relative active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl text-white"
        >
          <div className="text-[28px]">👤</div>
          <div className="text-[11px] font-medium">マイページ</div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded rotate-45" />
        </button>
      </div>
    </div>
  );
}

// -------------------- Main Page --------------------
function MainOnePage({ initialTab, txs, onTx, onApply }: { 
  initialTab: "apply" | "credits"; 
  txs: Tx[]; 
  onTx: (t: Tx) => void; 
  onApply: (l: ApplyLog) => void 
}) {
  const [tab, setTab] = useState<"apply" | "credits">(initialTab);
  const [creditsT, setCreditsT] = useState<number>(12.4);

  // フォームデータ
  const [formData, setFormData] = useState<ApplyFormData>({
    name: "",
    nameKana: "",
    postalCode: "",
    address: "",
    birthDate: "",
    phone1: "",
    phone2: "",
    email: "",
    agreeMain: false,
    agreeDataProvision: false,
    agreeNotificationObligation: false,
    agreeFaultNotification: false,
    agreeTerminationConditions: false,
    agreePersonalInfo: false,
    pcsVendor: "",
    pcsModel: "",
    pcsSerial: "",
    pcsQuantity: "",
    pcsRatedOutput: "",
    powerGenerationStartDate: "",
    powerReceptionStartDate: "",
    hasBattery: "無",
    batteryVendor: "",
    batteryModel: "",
    batteryCapacity: "",
    batteryQuantity: "",
    batteryCertifiedCapacity: "",
    batteryEffectiveCapacity: "",
    hasSubsidy: "無",
    subsidyName: "",
    subsidyProvider: "",
    confirmPcsNameplate: false,
    confirmPowerContract: false,
    confirmBatteryNameplate: false,
    confirmSpecSheet: false,
    confirmFinalCheck: false,
  });

  const [coupons, setCoupons] = useState<Coupon[]>([
    { 
      id: rid(), 
      brand: "GreenCafe", 
      icon: "☕", 
      face: 600,  
      needT: 0.1, 
      status: "redeemable", 
      desc: "GreenCafeで使えるドリンク券", 
      products: ["ホット/アイスコーヒー", "紅茶", "カフェラテ"] 
    },
    { 
      id: rid(), 
      brand: "EcoMart",   
      icon: "🛒", 
      face: 1200, 
      needT: 0.2, 
      status: "redeemable", 
      desc: "EcoMartで使えるお買い物クーポン", 
      products: ["青果・惣菜・日用品", "一部セール除外"] 
    },
    { 
      id: rid(), 
      brand: "LeafHotel", 
      icon: "🏨", 
      face: 3000, 
      needT: 0.5, 
      status: "redeemable", 
      desc: "LeafHotelで使える宿泊割引", 
      products: ["直予約限定", "税込総額から割引"] 
    },
  ]);

  const [submitted, setSubmitted] = useState<string | null>(null);
  const [previewRedeem, setPreviewRedeem] = useState<null | Coupon>(null);
  const [confirmUse, setConfirmUse] = useState<null | Coupon>(null);
  const [showBarcode, setShowBarcode] = useState<null | Coupon>(null);
  const [toast, setToast] = useState<string | null>(null);

  const kg = useMemo(() => Math.floor(creditsT * 1000), [creditsT]);

  const updateFormData = (field: keyof ApplyFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = [
      'name', 'nameKana', 'postalCode', 'address', 'birthDate', 
      'phone1', 'email', 'pcsVendor', 'pcsModel', 'pcsSerial', 
      'pcsQuantity', 'pcsRatedOutput'
    ];
    
    const missing = required.filter(field => !formData[field as keyof ApplyFormData]);
    if (missing.length > 0) {
      alert(`必須項目が未入力です: ${missing.join(', ')}`);
      return false;
    }

    if (!formData.powerGenerationStartDate && !formData.powerReceptionStartDate) {
      alert('発電開始日または受給開始日のいずれかを入力してください');
      return false;
    }

    const agreements = [
      'agreeMain', 'agreeDataProvision', 'agreeNotificationObligation', 
      'agreeFaultNotification', 'agreeTerminationConditions', 'agreePersonalInfo'
    ];
    
    const notAgreed = agreements.filter(field => !formData[field as keyof ApplyFormData]);
    if (notAgreed.length > 0) {
      alert('すべての同意項目にチェックしてください');
      return false;
    }

    if (formData.hasBattery === '有') {
      const batteryRequired = ['batteryVendor', 'batteryModel', 'batteryCapacity', 'batteryQuantity', 'batteryCertifiedCapacity', 'batteryEffectiveCapacity'];
      const batteryMissing = batteryRequired.filter(field => !formData[field as keyof ApplyFormData]);
      if (batteryMissing.length > 0) {
        alert(`蓄電池情報が未入力です: ${batteryMissing.join(', ')}`);
        return false;
      }
    }

    const confirmations = ['confirmPcsNameplate', 'confirmPowerContract', 'confirmSpecSheet', 'confirmFinalCheck'];
    const notConfirmed = confirmations.filter(field => !formData[field as keyof ApplyFormData]);
    if (notConfirmed.length > 0) {
      alert('確認項目にすべてチェックしてください');
      return false;
    }

    return true;
  };

  const submitApplication = () => {
    if (!validateForm()) return;
    
    const no = 'AP-' + rid();
    setSubmitted(no);
    onApply({ 
      id: rid(), 
      no, 
      at: new Date().toISOString(), 
      brand: '再エネ（電力）',
      startDate: formData.powerGenerationStartDate,
      receiveDate: formData.powerReceptionStartDate 
    });
  };

  const acceptRedeem = (c: Coupon) => {
    if (creditsT < c.needT) { 
      alert('クレジット残高が不足しています'); 
      return; 
    }
    
    setCreditsT(t => Math.max(0, Math.round((t - c.needT) * 10) / 10));
    setCoupons(list => list.map(x => 
      x.id === c.id ? { 
        ...x, 
        status: 'usable', 
        code: `DC-${rid()}-${rid().slice(0, 4)}`,
        pin: String(1000 + Math.floor(Math.random() * 9000)) 
      } : x
    ));
    
    onTx({ 
      id: rid(), 
      type: 'redeem', 
      label: `${c.brand} ¥${c.face.toLocaleString()}`, 
      t: c.needT, 
      jpy: c.face, 
      at: new Date().toISOString() 
    });
    
    setToast(`${c.brand} を引き換えました✨`);
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
    <div className="flex flex-col h-full relative">
      {/* タブ */}
      <div className="grid grid-cols-2 text-center text-sm sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-neutral-200">
        <button 
          className={`h-12 font-medium transition-all duration-300 ${
            tab === 'apply' 
              ? 'border-b-3 border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent font-bold' 
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => setTab('apply')}
        >
          申請
        </button>
        <button 
          className={`h-12 font-medium transition-all duration-300 ${
            tab === 'credits' 
              ? 'border-b-3 border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent font-bold' 
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => setTab('credits')}
        >
          保有
        </button>
      </div>

      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-16 bg-emerald-600 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {tab === 'apply' ? (
          <ApplicationForm 
            formData={formData}
            updateFormData={updateFormData}
            submitted={submitted}
            onSubmit={submitApplication}
          />
        ) : (
          <CreditsView 
            creditsT={creditsT}
            kg={kg}
            coupons={coupons}
            txs={txs}
            onPreviewRedeem={setPreviewRedeem}
            onConfirmUse={setConfirmUse}
          />
        )}
      </div>

      {/* モーダル類 */}
      {previewRedeem && (
        <RedeemModal 
          coupon={previewRedeem}
          onClose={() => setPreviewRedeem(null)}
          onRedeem={() => {
            acceptRedeem(previewRedeem);
            setPreviewRedeem(null);
          }}
        />
      )}

      {confirmUse && (
        <UseModal 
          coupon={confirmUse}
          onClose={() => setConfirmUse(null)}
          onUse={() => {
            confirmSwipeComplete(confirmUse);
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

// -------------------- Application Form --------------------
function ApplicationForm({ formData, updateFormData, submitted, onSubmit }: {
  formData: ApplyFormData;
  updateFormData: (field: keyof ApplyFormData, value: string | boolean) => void;
  submitted: string | null;
  onSubmit: () => void;
}) {
  if (submitted) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <Card className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            申請を受け付けました
          </div>
          <div className="text-lg font-semibold text-neutral-700 mb-3">
            受付番号：{submitted}
          </div>
          <div className="text-sm text-neutral-600">
            追加資料はトークでお送りください。
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      {/* 個人情報セクション */}
      <Card>
        <SectionHeader title="個人情報" icon="👤" />
        
        <FormField label="お名前" required>
          <input 
            className="form-input"
            value={formData.name}
            onChange={e => updateFormData('name', e.target.value)}
            placeholder="山田太郎"
          />
        </FormField>

        <FormField label="フリガナ（カタカナ）" required>
          <input 
            className="form-input"
            value={formData.nameKana}
            onChange={e => updateFormData('nameKana', e.target.value)}
            placeholder="ヤマダタロウ"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4">
          <FormField label="郵便番号" required>
            <input 
              className="form-input"
              value={formData.postalCode}
              onChange={e => updateFormData('postalCode', e.target.value)}
              placeholder="123-4567"
            />
          </FormField>

          <FormField label="住所" required>
            <textarea 
              className="form-textarea"
              value={formData.address}
              onChange={e => updateFormData('address', e.target.value)}
              placeholder="東京都渋谷区..."
              rows={2}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="生年月日" required>
            <input 
              type="date"
              className="form-input"
              value={formData.birthDate}
              onChange={e => updateFormData('birthDate', e.target.value)}
            />
          </FormField>

          <FormField label="電話番号1" required>
            <input 
              className="form-input"
              value={formData.phone1}
              onChange={e => updateFormData('phone1', e.target.value)}
              placeholder="090-1234-5678"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="電話番号2">
            <input 
              className="form-input"
              value={formData.phone2}
              onChange={e => updateFormData('phone2', e.target.value)}
              placeholder="03-1234-5678"
            />
          </FormField>

          <FormField label="メールアドレス" required>
            <input 
              type="email"
              className="form-input"
              value={formData.email}
              onChange={e => updateFormData('email', e.target.value)}
              placeholder="example@mail.com"
            />
          </FormField>
        </div>
      </Card>

      {/* 同意項目セクション */}
      <Card>
        <SectionHeader title="同意事項" icon="📋" />
        
        <div className="space-y-3">
          <CheckboxField 
            label="decoponに関する基本同意"
            checked={formData.agreeMain}
            onChange={checked => updateFormData('agreeMain', checked)}
            required
          />
          <CheckboxField 
            label="太陽光発電設備のデータ提供に関する同意"
            checked={formData.agreeDataProvision}
            onChange={checked => updateFormData('agreeDataProvision', checked)}
            required
          />
          <CheckboxField 
            label="故障・不具合発生時の通知義務に関する同意"
            checked={formData.agreeNotificationObligation}
            onChange={checked => updateFormData('agreeNotificationObligation', checked)}
            required
          />
          <CheckboxField 
            label="補償終了条件に関する同意"
            checked={formData.agreeTerminationConditions}
            onChange={checked => updateFormData('agreeTerminationConditions', checked)}
            required
          />
          <CheckboxField 
            label="個人情報提供に関する同意"
            checked={formData.agreePersonalInfo}
            onChange={checked => updateFormData('agreePersonalInfo', checked)}
            required
          />
        </div>
      </Card>

      {/* パワーコンディショナー */}
      <Card>
        <SectionHeader title="パワーコンディショナー" icon="🔋" />
        
        <div className="grid grid-cols-1 gap-4">
          <FormField label="メーカー名" required>
            <input 
              className="form-input"
              value={formData.pcsVendor}
              onChange={e => updateFormData('pcsVendor', e.target.value)}
              placeholder="例：パナソニック"
            />
          </FormField>

          <FormField label="型式" required>
            <input 
              className="form-input"
              value={formData.pcsModel}
              onChange={e => updateFormData('pcsModel', e.target.value)}
              placeholder="例：VBPC255A5"
            />
          </FormField>

          <FormField label="機器固有番号（製造番号）" required>
            <input 
              className="form-input"
              value={formData.pcsSerial}
              onChange={e => updateFormData('pcsSerial', e.target.value)}
              placeholder="例：ABC123456"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="設置数" required>
              <input 
                className="form-input"
                value={formData.pcsQuantity}
                onChange={e => updateFormData('pcsQuantity', e.target.value)}
                placeholder="例：2"
              />
            </FormField>

            <FormField label="定格出力（kW）" required>
              <input 
                className="form-input"
                value={formData.pcsRatedOutput}
                onChange={e => updateFormData('pcsRatedOutput', e.target.value)}
                placeholder="例：5.5"
              />
            </FormField>
          </div>
        </div>
      </Card>

      {/* 発電・受給開始日 */}
      <Card>
        <SectionHeader title="発電・受給開始" icon="📅" />
        
        <div className="grid grid-cols-1 gap-4">
          <FormField label="発電開始日">
            <input 
              type="date"
              className="form-input"
              value={formData.powerGenerationStartDate}
              onChange={e => updateFormData('powerGenerationStartDate', e.target.value)}
            />
          </FormField>

          <FormField label="受給開始日">
            <input 
              type="date"
              className="form-input"
              value={formData.powerReceptionStartDate}
              onChange={e => updateFormData('powerReceptionStartDate', e.target.value)}
            />
          </FormField>
        </div>
        
        <div className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded">
          💡 発電開始日または受給開始日のいずれか一つは必須入力です
        </div>
      </Card>

      {/* 蓄電池設備 */}
      <Card>
        <SectionHeader title="蓄電池設備" icon="🔋" />
        
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              name="battery"
              checked={formData.hasBattery === '有'}
              onChange={() => updateFormData('hasBattery', '有')}
            />
            有
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              name="battery"
              checked={formData.hasBattery === '無'}
              onChange={() => updateFormData('hasBattery', '無')}
            />
            無
          </label>
        </div>

        {formData.hasBattery === '有' && (
          <div className="space-y-4">
            <FormField label="メーカー名" required>
              <input 
                className="form-input"
                value={formData.batteryVendor}
                onChange={e => updateFormData('batteryVendor', e.target.value)}
                placeholder="例：テスラ"
              />
            </FormField>

            <FormField label="型式" required>
              <input 
                className="form-input"
                value={formData.batteryModel}
                onChange={e => updateFormData('batteryModel', e.target.value)}
                placeholder="例：Powerwall 2"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="容量" required>
                <input 
                  className="form-input"
                  value={formData.batteryCapacity}
                  onChange={e => updateFormData('batteryCapacity', e.target.value)}
                  placeholder="例：13.5kWh"
                />
              </FormField>

              <FormField label="設置数" required>
                <input 
                  className="form-input"
                  value={formData.batteryQuantity}
                  onChange={e => updateFormData('batteryQuantity', e.target.value)}
                  placeholder="例：1"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="認定容量（kWh）" required>
                <input 
                  className="form-input"
                  value={formData.batteryCertifiedCapacity}
                  onChange={e => updateFormData('batteryCertifiedCapacity', e.target.value)}
                  placeholder="例：13.5"
                />
              </FormField>

              <FormField label="実効容量（%）" required>
                <input 
                  className="form-input"
                  value={formData.batteryEffectiveCapacity}
                  onChange={e => updateFormData('batteryEffectiveCapacity', e.target.value)}
                  placeholder="例：90"
                />
              </FormField>
            </div>
          </div>
        )}
      </Card>

      {/* 補助金 */}
      <Card>
        <SectionHeader title="補助金申請" icon="💰" />
        
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              name="subsidy"
              checked={formData.hasSubsidy === '有'}
              onChange={() => updateFormData('hasSubsidy', '有')}
            />
            有
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              name="subsidy"
              checked={formData.hasSubsidy === '無'}
              onChange={() => updateFormData('hasSubsidy', '無')}
            />
            無
          </label>
        </div>

        {formData.hasSubsidy === '有' && (
          <div className="grid grid-cols-1 gap-4">
            <FormField label="補助金名称" required>
              <input 
                className="form-input"
                value={formData.subsidyName}
                onChange={e => updateFormData('subsidyName', e.target.value)}
                placeholder="例：住宅用太陽光発電設備導入支援事業"
              />
            </FormField>

            <FormField label="交付元" required>
              <input 
                className="form-input"
                value={formData.subsidyProvider}
                onChange={e => updateFormData('subsidyProvider', e.target.value)}
                placeholder="例：東京都"
              />
            </FormField>
          </div>
        )}
      </Card>

      {/* 確認項目 */}
      <Card>
        <SectionHeader title="必要書類・最終確認" icon="📄" />
        
        <div className="space-y-3">
          <CheckboxField 
            label="パワーコンディショナーの銘鈑写真を用意しました"
            checked={formData.confirmPcsNameplate}
            onChange={checked => updateFormData('confirmPcsNameplate', checked)}
            required
          />
          <CheckboxField 
            label="電力需給契約内容のお知らせの写しを用意しました"
            checked={formData.confirmPowerContract}
            onChange={checked => updateFormData('confirmPowerContract', checked)}
            required
          />
          {formData.hasBattery === '有' && (
            <CheckboxField 
              label="蓄電池の銘鈑写真を用意しました"
              checked={formData.confirmBatteryNameplate}
              onChange={checked => updateFormData('confirmBatteryNameplate', checked)}
              required
            />
          )}
          <CheckboxField 
            label="仕様書等の必要書類を用意しました"
            checked={formData.confirmSpecSheet}
            onChange={checked => updateFormData('confirmSpecSheet', checked)}
            required
          />
          <CheckboxField 
            label="記載内容に間違いがないことを確認しました"
            checked={formData.confirmFinalCheck}
            onChange={checked => updateFormData('confirmFinalCheck', checked)}
            required
          />
        </div>
      </Card>

      {/* 送信ボタン */}
      <button 
        onClick={onSubmit}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300"
      >
        申請を送信する 🚀
      </button>
    </div>
  );
}

// -------------------- Credits View --------------------
function CreditsView({ creditsT, kg, coupons, txs, onPreviewRedeem, onConfirmUse }: {
  creditsT: number;
  kg: number;
  coupons: Coupon[];
  txs: Tx[];
  onPreviewRedeem: (c: Coupon) => void;
  onConfirmUse: (c: Coupon) => void;
}) {
  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      {/* 合計クレジット */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
        <div className="text-center">
          <div className="text-sm text-emerald-700 mb-2 font-medium">Jクレジット合計</div>
          <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            {kg.toLocaleString()} <span className="text-lg">kg</span>
          </div>
          <div className="text-xs text-emerald-600">
            = {(Math.floor(creditsT * 10) / 10).toFixed(1)} tCO₂e
          </div>
          <div className="text-xs text-neutral-600 mt-2">
            銘柄：<span className="font-medium">再エネ（電力）</span>
          </div>
        </div>
      </Card>

      {/* 利用可能なクーポン */}
      <Card>
        <SectionHeader title="利用可能なクーポン" icon="🎫" />
        <CouponGrid 
          items={coupons.filter(c => c.status === 'usable')}
          mode="usable"
          onUse={onConfirmUse}
        />
      </Card>

      {/* 引き換え可能なクーポン */}
      <Card>
        <SectionHeader title="引き換え可能なクーポン" icon="🔄" />
        <CouponGrid 
          items={coupons.filter(c => c.status === 'redeemable')}
          mode="redeem"
          onPreviewRedeem={onPreviewRedeem}
          canRedeem={(c) => creditsT >= c.needT}
        />
      </Card>

      {/* 取引履歴 */}
      {txs.length > 0 && (
        <Card>
          <SectionHeader title="直近の履歴" icon="📈" />
          <div className="space-y-2">
            {txs.slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center text-sm py-2 border-b border-neutral-100 last:border-0">
                <span>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${t.type === 'redeem' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  {t.type === 'redeem' ? '引換' : '使用'} / {t.label}
                </span>
                <span className="text-neutral-500 text-xs">
                  {new Date(t.at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// -------------------- UI Components --------------------
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-neutral-100">
    <div className="text-xl">{icon}</div>
    <h3 className="text-lg font-bold bg-gradient-to-r from-neutral-700 to-neutral-900 bg-clip-text text-transparent">
      {title}
    </h3>
  </div>
);

const FormField: React.FC<React.PropsWithChildren<{ label: string; required?: boolean }>> = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; required?: boolean }> = ({ label, checked, onChange, required }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <input 
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded transition-all"
    />
    <span className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </span>
  </label>
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
      <div className="text-center py-8 text-neutral-500">
        <div className="text-4xl mb-2">🎁</div>
        <div className="text-sm">
          {mode === 'usable' ? 'まだありません' : '対象がありません'}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map(c => {
        if (mode === 'redeem') {
          const disabled = canRedeem ? !canRedeem(c) : false;
          return (
            <button
              key={c.id}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                disabled 
                  ? 'opacity-40 cursor-not-allowed border-neutral-200 bg-neutral-50' 
                  : 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.95]'
              }`}
              onClick={() => { if (!disabled && onPreviewRedeem) onPreviewRedeem(c); }}
            >
              <div className="text-2xl mb-2">{c.icon || '🎟️'}</div>
              <div className="text-sm font-semibold">{c.brand}</div>
              <div className="text-xs text-emerald-600">¥{c.face.toLocaleString()}</div>
              <div className="text-xs text-neutral-500 mt-1">{c.needT}t必要</div>
            </button>
          );
        }

        return (
          <div key={c.id} className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
            <div className="text-2xl mb-2">{c.icon || '🎟️'}</div>
            <div className="text-sm font-semibold mb-1">{c.brand}</div>
            <div className="text-xs text-green-600 mb-3">¥{c.face.toLocaleString()}</div>
            <button 
              onClick={() => onUse && onUse(c)}
              className="w-full h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-lg active:scale-[0.95] transition-all"
            >
              使用する
            </button>
          </div>
        );
      })}
    </div>
  );
};

// -------------------- My Page --------------------
function MyPage({ txs, applyLogs, email, setEmail }: { 
  txs: Tx[]; 
  applyLogs: ApplyLog[]; 
  email: string; 
  setEmail: (v: string) => void; 
}) {
  const [tempEmail, setTempEmail] = useState<string>(email);
  
  return (
    <div className="p-4 max-w-md mx-auto space-y-6 h-full overflow-y-auto">
      <Card>
        <SectionHeader title="プロフィール" icon="👤" />
        
        <div className="space-y-4">
          <div className="text-sm text-neutral-700 mb-3">
            表示名：<span className="font-semibold">Kento</span>
          </div>
          
          <FormField label="連絡先メール">
            <div className="flex gap-2">
              <input 
                type="email"
                className="form-input flex-1"
                placeholder="example@mail.com"
                value={tempEmail}
                onChange={e => setTempEmail(e.target.value)}
              />
              <button 
                onClick={() => setEmail(tempEmail)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm active:scale-95 transition-all"
              >
                保存
              </button>
            </div>
          </FormField>
          
          {email && (
            <div className="text-xs text-neutral-600 p-2 bg-green-50 rounded">
              ✅ 登録済み：{email}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="サポート" icon="🤝" />
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">よくある質問</h4>
            <ul className="space-y-1 text-sm text-neutral-700">
              <li>• Jクレジットとは？</li>
              <li>• クーポンは再表示できますか？</li>
              <li>• 申請の審査期間は？</li>
            </ul>
          </div>
          
          <button className="w-full h-10 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition-all">
            チャットで問い合わせる
          </button>
        </div>
      </Card>

      <Card>
        <SectionHeader title="クーポン履歴" icon="🎫" />
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {txs.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-4">
              まだ履歴がありません
            </div>
          ) : (
            txs.slice(0, 20).map(t => (
              <div key={t.id} className="flex justify-between text-sm py-2 border-b border-neutral-100 last:border-0">
                <span>{t.type === 'redeem' ? '引換' : '使用'} / {t.label}</span>
                <span className="text-neutral-500 text-xs">
                  {new Date(t.at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="申請履歴" icon="📋" />
        
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {applyLogs.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-4">
              まだ申請履歴がありません
            </div>
          ) : (
            applyLogs.slice(0, 20).map(a => (
              <div key={a.id} className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">受付 {a.no}</span>
                  <span className="text-neutral-500 text-xs">
                    {new Date(a.at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="text-xs text-neutral-600 mt-1">
                  {a.brand}
                  {a.startDate && ` / 発電開始: ${a.startDate}`}
                  {a.receiveDate && ` / 受給開始: ${a.receiveDate}`}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// -------------------- Modals --------------------
const Sheet: React.FC<React.PropsWithChildren<{ onClose: () => void }>> = ({ children, onClose }) => (
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={onClose}>
    <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const RedeemModal: React.FC<{ coupon: Coupon; onClose: () => void; onRedeem: () => void }> = ({ coupon, onClose, onRedeem }) => (
  <Sheet onClose={onClose}>
    <div className="text-center">
      <div className="text-4xl mb-3">{coupon.icon || '🎟️'}</div>
      <div className="text-xl font-bold mb-2">{coupon.brand}</div>
      <div className="text-2xl font-black text-emerald-600 mb-2">
        ¥{coupon.face.toLocaleString()}
      </div>
      <div className="text-sm text-neutral-600 mb-4">
        必要クレジット：{coupon.needT}t
      </div>
      
      {coupon.desc && (
        <p className="text-sm text-neutral-700 mb-3 p-3 bg-neutral-50 rounded-lg">
          {coupon.desc}
        </p>
      )}
      
      {coupon.products && coupon.products.length > 0 && (
        <div className="text-left mb-4">
          <h4 className="text-sm font-semibold mb-2">対象商品・内容</h4>
          <ul className="space-y-1 text-sm text-neutral-600">
            {coupon.products.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </div>
      )}

      <SwipeToConfirm onComplete={onRedeem}>
        スワイプして引き換える
      </SwipeToConfirm>
    </div>
  </Sheet>
);

const UseModal: React.FC<{ coupon: Coupon; onClose: () => void; onUse: () => void }> = ({ coupon, onClose, onUse }) => (
  <Sheet onClose={onClose}>
    <div className="text-center">
      <div className="text-4xl mb-3">{coupon.icon || '🎟️'}</div>
      <div className="text-xl font-bold mb-2">{coupon.brand}</div>
      <div className="text-2xl font-black text-green-600 mb-4">
        ¥{coupon.face.toLocaleString()}
      </div>
      
      <div className="text-sm text-amber-600 mb-6 p-3 bg-amber-50 rounded-lg">
        ⚠️ 一度バーコードを表示すると取り消せません（1回限り）
      </div>

      <SwipeToConfirm onComplete={onUse}>
        スワイプして使用
      </SwipeToConfirm>
    </div>
  </Sheet>
);

const BarcodeModal: React.FC<{ coupon: Coupon; onClose: () => void }> = ({ coupon, onClose }) => (
  <Sheet onClose={onClose}>
    <div className="text-center">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">{coupon.brand}</div>
        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
          1回限り
        </span>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <FakeBarcode seed={(coupon.code || '') + (coupon.pin || '')} />
        
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-3 bg-neutral-50 rounded-lg">
            <div className="text-xs text-neutral-500">コード</div>
            <div className="font-mono font-bold text-sm">{coupon.code || ''}</div>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <div className="text-xs text-neutral-500">PIN</div>
            <div className="font-mono font-bold text-sm">{coupon.pin || ''}</div>
          </div>
        </div>
        
        <p className="text-sm text-neutral-600 text-center mt-4 p-3 bg-blue-50 rounded-lg">
          📱 この画面を店員に見せてください<br />
          バーコードは再表示できません
        </p>
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
    <div className="bg-white border-2 border-black p-4 rounded-lg shadow-lg">
      <div className="h-24 w-64 bg-white flex items-stretch mb-2">
        {bars.map((w, i) => (
          <div 
            key={i} 
            style={{ width: w }} 
            className={i % 2 === 0 ? 'bg-black' : 'bg-white'} 
          />
        ))}
      </div>
      <div className="text-center text-xs font-mono tracking-widest text-neutral-600">
        {seed}
      </div>
    </div>
  );
};

const SwipeToConfirm: React.FC<React.PropsWithChildren<{ onComplete: () => void }>> = ({ children, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const base = trackRef.current?.getBoundingClientRect();
    if (!base) return;

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const dx = Math.max(0, Math.min(base.width - 50, x - startX));
      const newProgress = Math.round((dx / (base.width - 50)) * 100);
      setProgress(newProgress);
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      
      if (progress > 80) {
        onComplete();
      } else {
        setProgress(0);
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
        className="h-14 w-full rounded-full bg-neutral-200 border-2 border-neutral-300 relative overflow-hidden cursor-pointer"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div 
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
            progress > 80 ? 'bg-green-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${progress}%` }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-neutral-700 z-10">
          {children}
        </div>
        
        <div 
          className={`absolute top-1 left-1 h-12 w-12 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center shadow-lg transition-all duration-300 ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{ transform: `translateX(${progress * (trackRef.current?.offsetWidth || 0) / 100 - progress * 0.5}px) ${isDragging ? 'scale(1.1)' : ''}` }}
        >
          <span className="text-lg">→</span>
        </div>
      </div>
    </div>
  );
};