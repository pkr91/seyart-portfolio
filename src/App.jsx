import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Menu, X, Instagram, Mail, Phone, ChevronLeft, ChevronRight, 
  Award, Image as ImageIcon, BookOpen, MessageSquare, 
  ExternalLink, Calendar, MapPin, Tv, PlayCircle, Plus, Loader2,
  Home, Coffee, Briefcase, Layout, Sparkles, Newspaper, Search
} from 'lucide-react';

// --- 유틸리티: 이미지 플레이스홀더 생성 함수 ---
const getPlaceholderSrc = (title) => `https://via.placeholder.com/600x600?text=${encodeURIComponent(title)}`;

// --- 유틸리티: 이미지 밝기 분석 함수 ---
const getBrightness = (imageSrc, callback) => {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageSrc;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let r, g, b;
      let colorSum = 0;
      for (let x = 0, len = data.length; x < len; x += 4) {
        r = data[x];
        g = data[x + 1];
        b = data[x + 2];
        colorSum += Math.floor((r + g + b) / 3);
      }
      const brightness = Math.floor(colorSum / (img.width * img.height));
      callback(brightness);
    } catch (e) {
      callback(128); // CORS 보안 정책 등으로 접근 불가 시 중간값
    }
  };
  img.onerror = () => callback(128);
};

// --- 유틸리티: 작품 사이즈 파싱 함수 ---
const parseArtworkSize = (sizeStr) => {
  if (!sizeStr) return { width: 50, height: 50 };
  const parts = sizeStr.toLowerCase().replace('cm', '').split('x').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { width: parts[0], height: parts[1] };
  }
  return { width: 50, height: 50 };
};

// ==========================================
// 💡 [방법] 아래 백틱( ` ) 사이에 복사하신 경로 리스트를 그대로 붙여넣으세요.
// ==========================================
const RAW_TEXT_LIST = String.raw`
"D:\박규리\개인\엄마\전시 예정 작품 사진\공존│40x40cm│Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\금빛여정│90.9x72.7cm│Mixed Media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\금빛여정2│90.9x72.7cm│mixed media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\대칭│91.0x91.0cm│Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\매아리│53.0x45.5cm│mixed media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\바다의 속삭임│40x40cm│Mixed Media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\바다의 숨결│162.2x130.3cm│Mixed Media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\바람의 물결│162.2x130.3cm│Mixed Media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\비오는날│130.3x97.0cm│Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\숲의 빛│91.0x91.0cm│Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\숲의 틈새│72.7x60.6cm│mixed media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\은빛파도│65.1x53.0cm│mixed media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\지평의 색채│116.8x91.0cm│mixed media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\최고의 사랑│65.1x53.0cm│Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\틈의 울림Ⅰ│50x50cm│mixed media│ 2025.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\틈의 울림Ⅱ│50x50cm│mixed media│ 2025.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\환상│50x50cm│ Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\5월의 바람│72.7x60.6cm│ mixed media│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\Forest│50x50cm│Acrylic on canvas│2024.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\결의속삭임│50x50cm│Mixed Media│2025.jpg"
"D:\박규리\개인\엄마\전시 예정 작품 사진\결의속삭임2│50x50cm│Mixed Media│2025.jpg"
`.trim();

const generateArtworks = (rawText) => {
  const lines = rawText.split('\n').filter(line => line.trim().length > 0);
  return lines.map((line, index) => {
    const fullPath = line.replace(/"/g, "").trim();
    const fileName = fullPath.split('\\').pop(); 
    const pureText = fileName.replace(/\.[^/.]+$/, "");
    const parts = pureText.split("│");
    return {
      id: index + 1,
      title: parts[0]?.trim() || "무제",
      size: parts[1]?.trim() || "정보 없음",
      medium: parts[2]?.trim() || "Mixed Media",
      year: parts[3]?.trim() || "2024",
      category: index < 5 ? "Recent" : (index % 2 === 0 ? "Series" : "Nature"),
      fileName: fileName 
    };
  });
};

const ARTWORKS = generateArtworks(RAW_TEXT_LIST);

const ARTIST_INFO = {
  name: "신은영",
  engName: "Shin Eun Young",
  philosophy: "틈과 틈 사이에 서서, 보이지 않는 울림을 그리다.",
  bio: "20회의 개인전과 수많은 단체전을 통해 자신만의 독창적인 예술 세계를 구축해왔습니다. '틈', '달팽이의 꿈' 등 서정적이고 추상적인 주제를 통해 현대인에게 위로와 성찰의 시간을 선사합니다.",
  email: "seyart@naver.com",
  naverProfile: "https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=bjky&pkid=1&os=33617600&qvt=0&query=%EC%9E%91%EA%B0%80%20%EC%8B%A0%EC%9D%80%EC%98%81",
  address: "경기도 남양주시 화도읍 북한강로 1512 (아르템갤러리)",
  social: { 
    instagram: "https://instagram.com/eunyoung2164", 
    id: "@eunyoung2164" 
  }
};

const SOLO_EXHIBITIONS = [
  { year: "2024", title: "인사동 인사아트센터 개인전 (제20회)" },
  { year: "2024", title: "예인갤러리 초대개인전" },
  { year: "2024", title: "안녕 인사동 아트플러스갤러리 초대개인전" },
  { year: "2023", title: "파주 한빛중학교 초대개인전" },
  { year: "2023", title: "춘천 갤러리 오르 초대개인전" },
  { year: "2022", title: "혜화 마로니에 갤러리 초대개인전" },
  { year: "2022", title: "충무로 아르템갤러리 초대개인전" },
  { year: "2021", title: "오늘제빵소카페 갤러리 초대개인전" },
  { year: "2020", title: "인사동 라메르 갤러리 '틈과 틈 사이에 서서'" },
  { year: "2019", title: "인사동 조형갤러리 '틈' 개인전" },
  { year: "2018", title: "부산시설공단 갤러리 '달팽이의 꿈' 제10회" },
  { year: "2017", title: "서울시립미술관 경희궁 분관 개인전" },
  { year: "2016", title: "뉴욕 아트모라 갤러리 초대전" },
  { year: "2015", title: "가나인사아트센터 개인전" },
];

const DRAMA_WORKS = [
  "진짜가 나타났다", "우아한 제국", "황금가면", "빨강구두", "누가 뭐래도", "오! 삼광빌라", "괴리와 냉소"
];

const PRESS_ARTICLES = [
  { source: "부산일보", title: "'틈'에서 찾는 여백의 울림, 작가 신은영", url: "https://n.news.naver.com/mnews/article/082/0001286249?sid=102" },
  { source: "스타뉴스", title: "서양화가 신은영, 드라마 공간에 예술적 숨결을 더하다", url: "https://n.news.naver.com/mnews/article/108/0002662843" },
  { source: "ABC뉴스", title: "예술로 소통하는 '달팽이의 꿈', 신은영의 서정적 추상", url: "https://www.abcn.kr/news/articleView.html?idxno=77983" },
  { source: "한국정치경제신문", title: "신은영 작가, 제20회 개인전 통해 보여준 예술적 깊이", url: "https://kpenews.com/View.aspx?No=3110410" },
  { source: "인터뷰", title: "캔버스 위에 수놓은 존재의 '틈', 신은영 작가 인터뷰", url: "#" },
  { source: "비평", title: "현대 회화의 정수: 신은영의 작품 세계를 분석하다", url: "#" },
  { source: "칼럼", title: "드라마를 빛낸 미술 작품, 그 이상의 가치", url: "#" },
  { source: "리뷰", title: "성공적인 뉴욕 초대전, 글로벌 작가로 도약하다", url: "#" },
  { source: "전시관람", title: "자연과 인간의 공존을 그리다, 2024 신작 리뷰", url: "#" },
  { source: "언론보도", title: "신은영의 예술 철학: 비어있음으로 채우는 울림", url: "#" }
];

const ROOM_SCENES = [
  { id: 'living', name: '거실', img: '/livingroom.jpg', wallPos: 'top-[32%] left-[50%]' },
  { id: 'cafe', name: '카페', img: '/cafe.jpg', wallPos: 'top-[35%] left-[50%]' },
  { id: 'gallery', name: '복도', img: '/hallway.jpg', wallPos: 'top-[35%] left-[50%]' },
];

const ArtworkCard = ({ art, onClick }) => {
  const [aspect, setAspect] = useState('square');
  const imageSrc = `/works/${art.fileName}`; 

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio < 0.8) setAspect('portrait');
      else if (ratio > 1.25) setAspect('landscape');
      else setAspect('square');
    };
    img.onerror = () => setAspect('square');
  }, [imageSrc]);

  let sizeClass = "w-[320px] h-[310px]"; 
  if (aspect === 'portrait') sizeClass = "w-[420px] h-[640px]"; 
  if (aspect === 'landscape') sizeClass = "w-[480px] h-[310px]";

  return (
    <div className={`flex-shrink-0 px-2.5 ${sizeClass} cursor-pointer group`} onClick={() => onClick({...art, aspect})}>
      <div className="relative h-full bg-white shadow-sm hover:shadow-2xl transition-all duration-1000 overflow-hidden border border-neutral-100">
        <div className="w-full h-full bg-neutral-50 flex items-center justify-center transition-transform duration-1000 group-hover:scale-105">
          <img 
            src={imageSrc} 
            alt={art.title} 
            className="w-full h-full object-cover" 
            onError={(e) => { e.target.src = getPlaceholderSrc(art.title); }} 
          />
        </div>
        <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/80 transition-all duration-700 flex items-center justify-center opacity-0 group-hover:opacity-100">
           <div className="text-center text-white p-6 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700">
              <p className="text-[10px] tracking-[0.4em] uppercase mb-2 font-light text-neutral-400">{art.year}</p>
              <h4 className="text-lg font-serif tracking-tight mb-2">{art.title}</h4>
              <div className="w-6 h-px bg-white/30 mx-auto mt-4 group-hover:w-12 transition-all duration-1000"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArt, setSelectedArt] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [previewMode, setPreviewMode] = useState('info'); 
  const [activeRoom, setActiveRoom] = useState(ROOM_SCENES[0]);
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // --- 새로 추가된 상태 변수 ---
  const [activeRoomBrightness, setActiveRoomBrightness] = useState(128);
  const [calculatedSize, setCalculatedSize] = useState({ width: 0, height: 0 });

  const sliderRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const newsSliderRef = useRef(null);
  const [isNewsDown, setIsNewsDown] = useState(false);
  const [newsStartX, setNewsStartX] = useState(0);
  const [newsScrollLeft, setNewsScrollLeft] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 배경 밝기 분석 이펙트 ---
  useEffect(() => {
    getBrightness(activeRoom.img, setActiveRoomBrightness);
  }, [activeRoom]);

  // --- 작품 실제 사이즈 계산 이펙트 ---
  useEffect(() => {
    if (selectedArt) {
      const { width, height } = parseArtworkSize(selectedArt.size);
      // 기준: 배경 사진의 너비를 약 200cm로 가정했을 때의 스케일 (px 비율)
      // 100cm = 250px 정도로 잡으면 현실적입니다.
      const scaleFactor = 2.5; 
      setCalculatedSize({
        width: width * scaleFactor,
        height: height * scaleFactor,
      });
    }
  }, [selectedArt]);

  const categories = ['All', 'Recent', 'Series', 'Nature'];
  const filteredArtList = useMemo(() => 
    activeCategory === 'All' ? ARTWORKS : ARTWORKS.filter(art => art.category === activeCategory)
  , [activeCategory]);

  const loopList = useMemo(() => [...filteredArtList, ...filteredArtList, ...filteredArtList], [filteredArtList]);

  const handleMouseDown = (e) => { setIsDown(true); setStartX(e.pageX - sliderRef.current.offsetLeft); setScrollLeft(sliderRef.current.scrollLeft); };
  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);
  const handleMouseMove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - sliderRef.current.offsetLeft; const walk = (x - startX) * 2; sliderRef.current.scrollLeft = scrollLeft - walk; };
  const handleNewsMouseDown = (e) => { setIsNewsDown(true); setNewsStartX(e.pageX - newsSliderRef.current.offsetLeft); setNewsScrollLeft(newsSliderRef.current.scrollLeft); };
  const handleNewsMouseLeave = () => setIsNewsDown(false);
  const handleNewsMouseUp = () => setIsNewsDown(false);
  const handleNewsMouseMove = (e) => { if (!isNewsDown) return; e.preventDefault(); const x = e.pageX - newsSliderRef.current.offsetLeft; const walk = (x - newsStartX) * 1.5; newsSliderRef.current.scrollLeft = newsScrollLeft - walk; };
  const scrollNews = (direction) => { if (!newsSliderRef.current) return; newsSliderRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' }); };

  const handleContactSubmit = async (e) => {
    e.preventDefault(); setIsSending(true);
    try {
      const env = import.meta.env;
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: env.VITE_EMAILJS_SERVICE_ID, template_id: env.VITE_EMAILJS_TEMPLATE_ID, user_id: env.VITE_EMAILJS_PUBLIC_KEY,
          template_params: { from_name: contactData.name, from_email: contactData.email, phone: contactData.phone, message: contactData.message, type: "포트폴리오 고객 문의" }
        })
      });
      if(response.ok) { alert("메시지가 성공적으로 전송되었습니다."); setContactData({ name: '', email: '', phone: '', message: '' }); }
    } catch (error) { alert("전송 중 오류가 발생했습니다."); } finally { setIsSending(false); }
  };

  const handleInquiryRequest = (art) => {
    setContactData({ ...contactData, message: `안녕하세요. [${art.title}] 작품에 대한 소장 문의드립니다.\n(사이즈: ${art.size} / 제작년도: ${art.year})` });
    setSelectedArt(null); 
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-100">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        .animate-marquee { display: flex; width: fit-content; animation: marquee 100s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        html { scroll-behavior: smooth; }
        .custom-scrollbar::-webkit-scrollbar { height: 3px; width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        h1, h2, h3, .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-700 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-neutral-100 py-4 shadow-sm' : 'bg-transparent py-8'}`}>
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div className="group cursor-pointer">
            <h1 className="text-xl font-light tracking-[0.4em] uppercase">{ARTIST_INFO.engName}</h1>
            <p className="text-[8px] tracking-[0.6em] text-neutral-400 mt-1 uppercase font-bold">Contemporary Art</p>
          </div>
          <div className="hidden md:flex space-x-12 text-[10px] tracking-[0.3em] uppercase font-bold text-neutral-400">
            {['Home', 'About', 'Gallery', 'Exhibition', 'Media', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-neutral-900 transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-neutral-900 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden bg-white px-8">
        <div className="absolute inset-0 z-0 opacity-[0.03]">
          <div className="w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
        <div className="relative z-10 text-center space-y-10 max-w-4xl">
          <div className="space-y-4">
            <p className="text-neutral-400 tracking-[0.6em] uppercase text-[10px] font-bold">Portfolio & Archive</p>
            <h2 className="text-7xl md:text-9xl font-serif font-light tracking-tighter leading-none">{ARTIST_INFO.name}</h2>
          </div>
          <div className="h-px w-12 bg-neutral-200 mx-auto"></div>
          <p className="text-xl md:text-2xl text-neutral-500 font-serif font-light italic leading-relaxed">
            "{ARTIST_INFO.philosophy}"
          </p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-40 bg-white border-y border-neutral-50 text-left">
        <div className="container mx-auto px-8 max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="relative aspect-[4/5] bg-neutral-50 group overflow-hidden border border-neutral-100">
              <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                <img 
                  src="/profile.png" 
                  alt="신은영 작가 프로필"
                  className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${profileLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setProfileLoaded(true)}
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
                {!profileLoaded && (
                  <ImageIcon className="text-neutral-200 absolute z-0" size={60} strokeWidth={1} />
                )}
              </div>
            </div>
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <h4 className="text-5xl font-serif tracking-tight">{ARTIST_INFO.name}</h4>
                  <p className="text-neutral-300 text-lg font-light tracking-[0.2em]">{ARTIST_INFO.engName}</p>
                </div>
                <a href={ARTIST_INFO.naverProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-[9px] border border-neutral-200 text-neutral-400 px-5 py-2.5 rounded-full font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all duration-500">
                  <Search size={12} /> 네이버 프로필 보기
                </a>
              </div>
              <p className="text-lg text-neutral-600 font-light leading-relaxed text-justify">{ARTIST_INFO.bio}</p>
              <div className="pt-12 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-300 uppercase tracking-widest font-bold">소속</p>
                  <p className="text-sm font-medium">한국미술협회 서양화 1분과 이사</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-300 uppercase tracking-widest font-bold">활동</p>
                  <p className="text-sm font-medium">아르템갤러리 관장</p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-40 bg-white overflow-hidden text-left">
        <div className="container mx-auto px-8 mb-20 flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-4">
              <span className="text-neutral-300 tracking-[0.4em] uppercase text-[10px] font-bold">Selected Works</span>
              <h3 className="text-5xl font-serif tracking-tight">작품 목록</h3>
            </div>
            <div className="flex flex-wrap gap-10 text-[10px] uppercase tracking-[0.4em] font-bold">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`pb-2 border-b-2 transition-all duration-700 ${activeCategory === cat ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-200 hover:text-neutral-400'}`}>{cat}</button>
              ))}
            </div>
        </div>
        <div ref={sliderRef} className="cursor-grab active:cursor-grabbing overflow-x-auto no-scrollbar h-[680px]" onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
          <div className={`${!isDown ? 'animate-marquee' : 'flex w-fit'} flex-col flex-wrap content-start h-full gap-8 px-4`}>
            {loopList.map((art, idx) => (
              <ArtworkCard key={`${art.id}-${idx}`} art={art} onClick={(a) => { setSelectedArt(a); setPreviewMode('info'); }} />
            ))}
          </div>
        </div>
      </section>

      {/* Exhibition */}
      <section id="exhibition" className="py-40 bg-neutral-50 text-left border-y border-neutral-100">
        <div className="container mx-auto px-8 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-24">
            <div className="lg:col-span-1 space-y-8">
              <span className="text-neutral-400 tracking-[0.4em] uppercase text-[10px] font-bold">Timeline</span>
              <h4 className="text-5xl font-serif tracking-tight leading-tight">전시 이력</h4>
              <p className="text-neutral-400 font-light leading-relaxed text-sm">
                20여 회의 개인전과 수많은 단체전을 통해<br/>이어온 예술적 행보의 기록입니다.
              </p>
            </div>
            <div className="lg:col-span-2 border-l border-neutral-200 ml-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-12 text-left">
              {SOLO_EXHIBITIONS.map((ex, idx) => (
                <div key={idx} className="relative pl-16 pb-16 group last:pb-0">
                  <div className="absolute left-0 top-2 w-2 h-2 bg-neutral-200 border border-white rounded-full -translate-x-1/2 group-hover:bg-neutral-900 transition-all duration-500"></div>
                  <span className="text-[10px] tracking-[0.4em] text-neutral-300 font-bold uppercase mb-2 block">{ex.year}</span>
                  <h5 className="text-lg font-serif text-neutral-700 group-hover:text-neutral-900 transition-colors leading-snug">{ex.title}</h5>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* Media & News Section */}
      <section id="media" className="py-40 bg-neutral-900 text-white overflow-hidden text-left">
        <div className="container mx-auto px-8 max-w-6xl">
            <div className="flex flex-col gap-16 mb-20 text-left">
                <div className="space-y-12">
                  <div className="space-y-4">
                    <span className="text-neutral-500 tracking-[0.5em] uppercase text-[10px] font-bold">Collaborations</span>
                    <h3 className="text-5xl font-serif tracking-tight leading-tight">드라마 협찬 작품</h3>
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-5 text-[11px] tracking-[0.2em] text-neutral-500 font-bold uppercase">
                    {DRAMA_WORKS.map((drama, i) => (
                      <a key={i} href={`https://namu.wiki/w/${encodeURIComponent(drama)}`} target="_blank" rel="noopener noreferrer" className="border-b border-neutral-800 pb-1 hover:text-white hover:border-neutral-400 transition-all flex items-center gap-2 group/link">
                        {drama} <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
                
                <div className="w-full max-w-5xl mx-auto">
                    <div className="relative aspect-video bg-black shadow-2xl rounded-sm overflow-hidden border border-white/5">
                        <iframe 
                            src="https://www.youtube.com/embed/NXrGvPJIF48" 
                            title="드라마 협찬 영상"
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>

            <div className="space-y-16 border-t border-white/5 pt-20 relative group/news-section">
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-4 text-left">
                      <span className="text-neutral-500 tracking-[0.5em] uppercase text-[10px] font-bold">Journal</span>
                      <h3 className="text-5xl font-serif tracking-tight leading-tight uppercase">언론 보도</h3>
                    </div>
                    <div className="hidden md:flex gap-4">
                        <button onClick={() => scrollNews('left')} className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center hover:bg-white hover:text-neutral-900 transition-all duration-500"><ChevronLeft size={24} strokeWidth={1} /></button>
                        <button onClick={() => scrollNews('right')} className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center hover:bg-white hover:text-neutral-900 transition-all duration-500"><ChevronRight size={24} strokeWidth={1} /></button>
                    </div>
                </div>
                <div ref={newsSliderRef} onMouseDown={handleNewsMouseDown} onMouseLeave={handleNewsMouseLeave} onMouseUp={handleNewsMouseUp} onMouseMove={handleNewsMouseMove}
                  className={`flex overflow-x-auto pb-10 gap-8 custom-scrollbar snap-x no-scrollbar ${isNewsDown ? 'cursor-grabbing' : 'cursor-grab'}`}>
                    {PRESS_ARTICLES.map((article, i) => (
                        <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" onClick={(e) => isNewsDown && e.preventDefault()} 
                          className="min-w-[300px] md:min-w-[380px] bg-white/[0.02] p-10 rounded-sm hover:bg-white/[0.05] transition-all duration-700 group border border-white/5 snap-start relative text-left">
                            <Newspaper className="text-neutral-700 mb-8 group-hover:text-neutral-400 transition-colors" size={28} strokeWidth={1} />
                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-4">{article.source}</p>
                            <h5 className="text-lg font-serif leading-relaxed text-neutral-300 group-hover:text-white transition-all h-14 overflow-hidden">{article.title}</h5>
                        </a>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-40 bg-white text-left">
        <div className="container mx-auto px-8 max-w-6xl flex flex-col md:flex-row gap-40">
            <div className="md:w-2/5 space-y-16">
              <div className="space-y-6">
                <span className="text-neutral-300 tracking-[0.4em] uppercase text-[10px] font-bold">Communication</span>
                <h3 className="text-6xl font-serif tracking-tight leading-tight">문의하기</h3>
              </div>
              <div className="space-y-12 text-neutral-600">
                <div className="flex items-center gap-8 group">
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500"><Mail size={20} strokeWidth={1} /></div>
                  <div><p className="text-[10px] text-neutral-300 uppercase font-bold tracking-widest mb-1">Email</p><p className="text-lg font-serif">{ARTIST_INFO.email}</p></div>
                </div>
                <div className="flex items-center gap-8 group">
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500"><Instagram size={20} strokeWidth={1} /></div>
                  <div><p className="text-[10px] text-neutral-300 uppercase font-bold tracking-widest mb-1">Social</p><a href={ARTIST_INFO.social.instagram} target="_blank" rel="noopener noreferrer" className="text-lg font-serif hover:text-neutral-400 transition-colors">{ARTIST_INFO.social.id}</a></div>
                </div>
                <div className="flex items-center gap-8 group text-left">
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500"><MapPin size={20} strokeWidth={1} /></div>
                  <div><p className="text-[10px] text-neutral-300 uppercase font-bold tracking-widest mb-1">Address</p><p className="text-sm font-bold">{ARTIST_INFO.address}</p></div>
                </div>
              </div>
            </div>
            <div className="md:w-3/5 bg-neutral-50 p-12 md:p-16 border border-neutral-100 rounded-sm">
              <form className="space-y-8" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input required value={contactData.name} onChange={(e) => setContactData({...contactData, name: e.target.value})} type="text" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors" placeholder="성함" />
                  <input required value={contactData.email} onChange={(e) => setContactData({...contactData, email: e.target.value})} type="email" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors" placeholder="이메일" />
                </div>
                <input required value={contactData.phone} onChange={(e) => setContactData({...contactData, phone: e.target.value})} type="tel" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors" placeholder="연락처" />
                <textarea required value={contactData.message} onChange={(e) => setContactData({...contactData, message: e.target.value})} rows="5" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors resize-none" placeholder="내용을 입력해주세요"></textarea>
                <button disabled={isSending} type="submit" className="w-full bg-neutral-900 text-white p-5 text-sm tracking-[0.4em] font-bold uppercase flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-xl">
                  {isSending ? <Loader2 className="animate-spin" size={16} /> : "메시지 보내기"}
                </button>
              </form>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-neutral-50 text-center border-t border-neutral-100">
        <h2 className="text-lg font-serif tracking-[0.4em] uppercase mb-10 text-neutral-300">{ARTIST_INFO.engName}</h2>
        <div className="flex justify-center gap-12 text-[9px] uppercase tracking-[0.5em] font-bold text-neutral-300 mb-12">
           <a href="#home" className="hover:text-neutral-900 transition-colors">Home</a>
           <a href="#gallery" className="hover:text-neutral-900 transition-colors">Gallery</a>
           <a href="#contact" className="hover:text-neutral-900 transition-colors">Contact</a>
        </div>
        <p className="text-[9px] text-neutral-300 uppercase tracking-[0.4em]">© 2024 Artist Shin Eun Young. Portfolio.</p>
      </footer>

      {/* Modal */}
      {selectedArt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white animate-in fade-in duration-700 overflow-hidden text-left">
          <button className="absolute top-8 right-8 text-neutral-900 z-50 hover:rotate-90 transition-transform duration-500" onClick={() => setSelectedArt(null)}><X size={28} strokeWidth={1} /></button>
          <div className="container mx-auto max-w-6xl h-full flex flex-col">
            <div className="flex justify-center gap-10 mt-10 mb-10 border-b border-neutral-50 shrink-0">
               <button onClick={() => setPreviewMode('info')} className={`pb-4 text-[10px] tracking-[0.4em] uppercase font-bold transition-all ${previewMode === 'info' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-300'}`}>Work Detail</button>
               <button onClick={() => setPreviewMode('simulation')} className={`pb-4 text-[10px] tracking-[0.4em] uppercase font-bold transition-all ${previewMode === 'simulation' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-300'}`}>가상 배치</button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              {previewMode === 'info' ? (
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center min-h-full py-6 px-4">
                  <div className="lg:w-[55%] bg-neutral-50 p-6 md:p-12 flex items-center justify-center shadow-xl border border-neutral-100 overflow-hidden rounded-sm">
                    <img src={`/works/${selectedArt.fileName}`} alt={selectedArt.title} className="max-w-full max-h-[65vh] object-contain shadow-2xl transition-transform duration-1000" onError={(e) => { e.target.src = getPlaceholderSrc(selectedArt.title); }} />
                  </div>
                  <div className="lg:w-[45%] space-y-10 w-full text-left">
                    <div className="space-y-4">
                      <p className="text-xs text-neutral-300 tracking-[0.3em] uppercase font-bold">{selectedArt.year}</p>
                      <h3 className="text-3xl md:text-4xl font-serif tracking-tight leading-snug break-keep">{selectedArt.title}</h3>
                      <p className="text-lg text-neutral-400 italic font-serif font-light">{selectedArt.medium}</p>
                    </div>
                    <div className="py-8 border-y border-neutral-50 text-[11px] flex justify-between items-center uppercase tracking-widest font-bold">
                      <span className="text-neutral-300">Dimensions</span><span className="text-neutral-900 font-serif text-lg">{selectedArt.size}</span>
                    </div>
                    <button onClick={() => handleInquiryRequest(selectedArt)} className="w-full bg-neutral-900 text-white py-5 md:py-6 text-[12px] tracking-[0.4em] font-bold uppercase flex items-center justify-center gap-4 hover:bg-neutral-800 transition-all shadow-xl rounded-sm">
                      작품 소장 문의하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-12 py-6 min-h-full text-center px-4">
                  <div className="flex flex-wrap justify-center gap-4">
                    {ROOM_SCENES.map(room => (
                      <button key={room.id} onClick={() => setActiveRoom(room)} className={`px-8 py-2 rounded-full text-[10px] tracking-[0.3em] uppercase font-bold border transition-all duration-700 ${activeRoom.id === room.id ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-100 text-neutral-300'}`}>{room.name}</button>
                    ))}
                  </div>
                  <div className="relative w-full max-w-5xl aspect-video bg-neutral-100 shadow-inner overflow-hidden rounded-sm border border-neutral-100">
                    <img src={activeRoom.img} alt={activeRoom.name} className="w-full h-full object-cover transition-opacity duration-1000" />
                    <div className="absolute inset-0 bg-black/[0.01]"></div>
                    {/* Realistic Frame with Shadows & Brightness Adjustment */}
                    <div 
                      className={`absolute -translate-x-1/2 -translate-y-1/2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border-[4px] border-white transition-all duration-700 ease-in-out ${activeRoom.wallPos}`}
                      style={{ 
                        width: `${calculatedSize.width}px`, 
                        height: `${calculatedSize.height}px`,
                        // 배경이 어두울수록 작품에 더 진한 그림자 오버레이 적용 (최대 40%)
                        boxShadow: `inset 0 0 100px rgba(0,0,0,${Math.max(0, (128 - activeRoomBrightness) / 255 * 0.8)})`
                      }}
                    >
                      <div className="w-full h-full bg-neutral-50 flex items-center justify-center font-bold text-[8px] md:text-[10px] text-neutral-400 p-2 text-center bg-white shadow-inner relative overflow-hidden">
                        <div className="relative z-10 font-bold uppercase tracking-tight leading-tight">
                          {/* 밝기 조절용 오버레이 */}
                          <div 
                            className="absolute inset-0 pointer-events-none transition-all duration-700"
                            style={{ backgroundColor: `rgba(0,0,0,${Math.max(0, (128 - activeRoomBrightness) / 255 * 0.4)})` }}
                          ></div>
                          <img src={`/works/${selectedArt.fileName}`} alt={selectedArt.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = getPlaceholderSrc(selectedArt.title); }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="max-w-2xl mx-auto text-[11px] text-neutral-400 font-serif italic leading-relaxed tracking-wider font-bold">
                    * 가상 배치도는 작품의 실제 규격을 기반으로 제작되었습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;