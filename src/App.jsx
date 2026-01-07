import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu, X, Instagram, Mail, Phone, ChevronLeft, ChevronRight,
  Award, Image as ImageIcon, BookOpen, MessageSquare,
  ExternalLink, Calendar, MapPin, Tv, PlayCircle, Plus, Loader2,
  Home, Coffee, Briefcase, Layout, Sparkles, Newspaper, Search,
  ZoomIn, ZoomOut, MoveUp, MoveDown, MoveLeft, MoveRight, RotateCcw,
  ChevronDown
} from 'lucide-react';

// 파일 최상단 변수 선언부
const BASE_URL = '/';

// --- 유틸리티: 외부 연결 없는 대체 이미지 (SVG 데이터) ---
const getPlaceholderSrc = () => {
  return `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22600%22%20height%3D%22600%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f0f0%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%23cccccc%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EImage%3C/text%3E%3C/svg%3E`;
};

// --- 유틸리티: 파일명을 안전한 URL로 변환 (특수문자 대응 강화) ---
const getSafePath = (dir, fileName) => {
  if (!fileName) return '';

  // 1. 파일 이름 앞뒤의 혹시 모를 공백 제거
  const cleanName = fileName.trim();

  // 2. 경로의 루트 설정 (Vercel 배포 대응)
  const root = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

  // 3. encodeURIComponent는 콤마(,)를 포함한 특수문자를 가장 안전하게 변환합니다.
  // 만약 이래도 안 나온다면, 서버가 인코딩된 파일명을 찾지 못하는 것이므로 
  // 실제 파일명에서 콤마를 지우는 것이 가장 좋습니다.
  return `${root}${dir}/${encodeURIComponent(cleanName)}`;
};

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
      callback(128);
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
// 💡 사진은 public/works/ 폴더 안에 들어있어야 함
// ==========================================
const RAW_TEXT_LIST = String.raw`
가을 틈│53.0x45.5cm│mixed media│2021.jpg
푸르고 깊던 시절│60.6x72.7cm│mixed media│2020.jpg
The end of COVID 19│90.0x72.7cm│mixed media│2021.jpg
겨울 밤 창문 틈│90.9x72.7cm│mixed media│2021.jpg
욕망 틈 2│90.9x72.7cm│mixed media│2021.jpg
느낌 좋아│33.4x24.2cm│oil and acrylic on canvas│2019.jpg
각자의 삶│33.4x24.2cm│oil and acrylic on canvas│2019.jpg
오르다│33.4x24.2cm│oil and acrylic on canvas│2019.jpg
질주│31.8x31.8cm│oil and acrylic on canvas│2019.jpg
봄날에│37.9x37.9cm│oil and acrylic on canvas│2019.jpg
비움과 채움 반복Ⅱ│40.9x31.8cm│oil and acrylic on canvas│2019.jpg
동행 2│53.0x45.5cm│oil and acrylic on canvas│2019.jpg
비움과 채움 반복│45.5x37.9cm│oil and acrylic on canvas│2019.jpg
동행│53.0x45.5cm│oil and acrylic on canvas│2019.jpg
회색 도시│65.1x53.0cm│oil and acrylic on canvas│2019.jpg
어느 봄날에│72.7x50.0cm│oil and acrylic on canvas│2019.jpg
어느 겨울 날에│72.7x50.0cm│oil on canvas│2019.jpg
어느 여름날에│72.7x50.0cm│Acrylic on canvas│72.7x50.0cm│2020.jpg
환희 2│72.7x53.0cm│oil and acrylic on canvas│2020.jpg
그냥 좋은 날 1│92x36cm│oil and acrylic on canvas│2020.jpg
그냥 좋은 날 2│92x36cm│oil and acrylic on canvas│2020.jpg
도시 속 외로움│90.9x72.7cm│oil and acrylic on canvas│2019.jpg
울림│50x50cm│mixed media│2025.jpg
회복Ⅰ│15x15cm│Mixed Media│2025.jpg
열정Ⅰ│15x15cm│Acrylic on canvas│2025.jpg
희망Ⅰ│15x15cm│Mixed Media│2025.jpg
회복Ⅱ│15x15cm│Acrylic on canvas│2025.jpg
마음│20x20cm│mixed media│2025.jpg
흔적│20x20cm│Acrylic on canvas│2025.jpg
열정Ⅱ│15x15cm│Acrylic on canvas│2025.jpg
희망Ⅱ│15x15cm│Acrylic on canvas│2025.jpg
푸른 고요│16.8x91cm│oil on canvas│2020.jpg
내면의 물결│90.9x72.7cm│ mixed media│2025.jpg
하늘이 머문 초록│50x50cm│Mixed media│2025.jpg
떨어지는 마음들│72.7x60.6cm│ mixed media│2025.jpg
8월의 크리스마스│91x72.7cm│mixed media│2025.jpg
침묵의 꽃│40x40cm│mixed media│2023.jpg
결의속삭임Ⅱ│50x50cm│Mixed Media│2025.jpg
결의속삭임Ⅰ│50x50cm│Mixed Media│2025.jpg
틈의 울림Ⅰ│50x50cm│mixed media│ 2025.jpg
틈의 울림Ⅱ│50x50cm│mixed media│ 2025.jpg
맥박│72.7x72.7cm│mixed media│2025.jpg
시간의 틈새│33.4x24.2cm│mixed media│2023.jpg
자연의 리듬│130x97cm│mixed media│2024.jpg
파동│162.2x130.3cm│Mixed Media│2024.jpg
지평의 색채│116.8x91.0cm│mixed media│2024.jpg
태양의 숨결│162.2x130.3cm│mixed media│2024.jpg
금빛여정│90.9x72.7cm│Mixed Media│2024.jpg
속삭임│130.3x130.3cm│mixed media│2024.jpg
바람의 물결│162.2x130.3cm│Mixed Media│2024.jpg
바다의 숨결│162.2x130.3cm│Mixed Media│2024.jpg
Prime years (인생의 황금기)│40.9x31.8cm│Mixed Media│2024.jpg
시선│53.0x40.9cm│Mixed Media│2024.jpg
공존│40x40cm│Acrylic on canvas│2024.jpg
바다의 속삭임│40x40cm│Mixed Media│2024.jpg
가을결│45.5x37.9cm│Mixed Media│2024.jpg
희미한 파동│40x40cm│Acrylic on canvas│2024.jpg
일상의 기쁨│40x40cm│Mixed Media│2024.jpg
비오는날│130.3x97.0cm│Acrylic on canvas│2024.jpg
여정2│130.3x97.0cm│Mixed Media│2024.jpg
여정1│130.3x97.0cm│Mixed Media│2024.jpg
희망│130.3x130.3cm│Mixed Media│2024.jpg
무제│ 40x40cm│ Acrylic on canvas│2024.jpg
작은 틈의 울림│53.0x45.5cm│mixed media│ 2024.jpg
빛으로의 문 │116.8x91.0cm│Mixed Media│2024.jpg
숲의 틈새│72.7x60.6cm│mixed media│2024.jpg
최고의 사랑│65.1x53.0cm│Acrylic on canvas│2024.jpg
무제│50x50cm│mixed media│2024.jpg
결Ⅱ │40x40cm│mixed media│2024.jpg
숲의 잔상│40x40cm│Acrylic on canvas│2024.jpg
틈의 중심│53.0x40.9cm│mixed media│2024.jpg
무제 │ 53.0x45.5cm│mixed media│2024.jpg
무제 │53.0x45.5cm│mixed media│2024.jpg
은빛파도│65.1x53.0cm│mixed media│2024.jpg
금빛여정Ⅱ│90.9x72.7cm│mixed media│2024.jpg
창조의 원류│116.8x91.0cm│Mixed Media│2024.jpg
숲의 파도│ 40x40cm│Acrylic on canvas│2024.jpg
결Ⅰ│40x40cm│ mixed media│2024.jpg
무제│50x50cm│mixed media│2024 (2).jpg
바람의 흔적│65.1x53cm│mixed media│2024.jpg
5월의 바람│72.7x60.6cm│ mixed media│2024.jpg
Forest│50x50cm│Acrylic on canvas│2024.jpg
환상│50x50cm│ Acrylic on canvas│2024.jpg
물빛향연Ⅰ│72.7x53.0cm│Acrylic on canvas│2024.jpg
물빛향연Ⅱ│72.7x53.0cm│Acrylic on canvas│2024.jpg
흐름의여백│162.2x130.3cm│Mixed Media│2024.jpg
빛나리 Ⅲ│40x40cm│mixed media│2024.jpg
빛나리 Ⅱ│40x40cm│mixed media│2024.jpg
매아리│53.0x45.5cm│mixed media│2024.jpg
고요│72.7x60.6cm│Mixed Media│2024.jpg
아우성의 틈│53x40.9cm│mixed media│2024.jpg
무제4│45.5x33.4cm│mixed media│2024.jpg
여인│45.5x33.4cm│mixed media│2024.jpg
잔상│45.5x37.9cm│mixed media│2024.jpg
바람의 틈│37.9x37.9cm│mixed media│2023.jpg
마음의 풍경 2│37.9x37.9cm│mixed media│2022.jpg
녹색서사│90.0x72.7cm│mixed media│2023.jpg
숲의 빛│91.0x91.0cm│Acrylic on canvas│2024.jpg
빛의 문턱│116.8x91.0cm│Mixed Media│2023 (3).jpg
심연의 구조│116.8x91.0cm│Mixed Media│2023 (2).jpg
가을 틈 Ⅲ│31.8x31.8cm│mixed media│2023.jpg
희망의 틈│31.8x31.8cm│mixed media│2023.jpg
파노라마│72.7x72.7cm│mixed media│2023.jpg
생각의 의자│72.7x60.6cm│Acrylic on canvas│2024.jpg
대칭│91.0x91.0cm│Acrylic on canvas│2024.jpg
여름날에│72.7x72.7cm│mixed media│2023.jpg
봄의 틈│72.7x72.7cm│mixed media│2023.jpg
무제2│53.0x45.5cm│mixed media│2024.jpg
무제│53.0x45.5cm│mixed media│2024.jpg
무제3│53.0x45.5cm│mixed media│2024.jpg
가을 틈 Ⅱ│31.8x31.8cm│mixed media│2023.jpg
무제  │40x40cm│ mixed media│2024.jpg
무제│40x40cm│ mixed media│ 2024.jpg
여름 그사이│31.8x31.8cm│mixed media│2023.jpg
틈과 틈 사이에 │72.7x72.7cm│mixed media│2023.jpg
틈과 틈 사이에│72.7x72.7cm│mixed media│2023.jpg
틈과 틈 사이에 2│72.7x72.7cm│mixed media│2023.jpg
빛나리│40x40cm│mixed media│2023.jpg
심연의 꿈│116.8x91.0cm│Mixed Media│2023.jpg
틈과 틈│100.0x72.7cm│Mixed Media│2023.jpg
빛의 틈 Ⅲ│40.9x31.8cm│mixed media│2022.jpg
바람날에│90.9x130.2cm│mixed media│2023.jpg
3월의 틈│33.4x24.2cm│mixed media│2022.jpg
마음의틈│53.0x33.4cm│mixed media│2023.jpg
바람의 틈 Ⅰ│116.8x91cm│mixed media│2023.jpg
달을 품다│162.2x130.3cm│mixed media│2023.jpg
틈과 틈사이 Ⅱ│116.8x91.0cm│Mixed Media│2023.jpg
틈과 틈사이 Ⅲ│116.8x91.0cm│Mixed Media│2023.jpg
산│33.4x24.2cm│mixed media│2022.jpg
금빛│33.4x24.2cm│mixed media│2023.jpg
사랑의 틈 Ⅰ│90.9x72.7cm│mixed media│2022.jpg
키다리 아저씨│90.9x72.7cm│mixed media│2022.jpg
황금물결│72.7x60.6cm│mixed media│2022.jpg
보라 빛 향기│90.9x72.7cm│mixed media│2023.jpg
Sunsrise│33.4x19cm│mixed media│2020.jpg
틈│65.1x53cm│mixed media│2022.jpg
마음에 풍경│33.4x24.2cm│mixed media│2022.jpg
빛의 틈 Ⅱ│33.4x24.2cm│mixed media│2022.jpg
빛의 틈│33.4x24.2cm│mixed media│2022.jpg
틈과 틈사이 Ⅰ│72.7x60.6cm│mixed media│2022.jpg
금빛물결│40.9x31.8cm│mixed media│2022.jpg
욕망의 틈│90.0x72.7cm│mixed media│2022.jpg
흔적의 층위│90.9x72.7cm│Mixed Media│2022.jpg
잠식│72.7x60.6cm│mixed media│2022.jpg
숲안개72.7x60.6cm│mixed media│2022.jpg
바람의 틈 Ⅱ│90.0x72.7cm│mixed media│2022.jpg
깊고 푸름 그사이│53.0x45.5cm│mixed media│2021.jpg
화양연화.jpg
여백│162.2x130.3cm│mixed media│2022.jpg
기억의 층│162.2x130.3cm│mixed media│2022.jpg
햇살의 결│37.9x37.9cm│mixed media│2022.jpg
마음에 틈 │40.9x31.8cm│mixed material canvas│2022.jpg
골드 카펫│72.7x60.6cm│Mixed Media│2022.jpg
여름날의 숨결│92x36cm│oil on canvas│2022.jpg
사랑의 틈 Ⅱ│90.9x72.7cm│mixed media│2022.jpg
석양 틈 │40.9x31.8cm│Mixed Media│2022.jpg
잠식의 시작 일상의 빈 틈│72.7x60.6cm│oil on canvas│2020.jpg
눈이 오네 봄이 오네 1│72.7x53.0cm│Acrylic on canvas│2021.jpg
눈이 오네 봄이 오네 2│72.7x53.0cm│Acrylic on canvas│2021.jpg
석양│116.8x91cm│mixed media│2020.jpg
봄 그리고 여름 사이2│53.0x45.5cm│mixed media│2021.jpg
봄 그리고 여름 사이│53.0x45.5cm│mixed media│2021.jpg
숲의 단면│90.9x72.7cm│mixed media│2021.jpg
갈증 틈│53.0x45.5cm│mixed media│2021.jpg
희망의 틈│40.9x31.8cm│mixed media│2021.jpg
가라 앉은 틈│33.4x33.4cm│oil on canvas│2021.jpg
바다│33.4x24.2cm│Acrylic on canvas│2021.jpg
숲 틈│33.4x24.2cm│oil on canvas│2021.jpg
나무│25.8x17.9cm│oil on canvas│2021.jpg
꽃 비가 내리는 날에 2│116.8x91.0cm│Acrylic on canvas│2021.jpg
꽃 비가 내리는 날에 1│116.8x91.0cm│Acrylic on canvas│2021.jpg
초록 빛 어느 여름날│90.0x72.7cm│oil on canvas│2020.jpg
숲의 측면│116.8x91.0cm│mixed media│2021.jpg
5월 꽃바람 2│116.8x91.0cm│Acrylic on canvas│2021.jpg
5월 꽃바람 1│116.8x91.0cm│Acrylic on canvas│2021.jpg
틈의 왈츠│116.8x91cm│mixed media│2021.jpg
`.trim();

const generateArtworks = (rawText) => {
  // 줄바꿈으로 나누고 빈 줄은 제외
  const lines = rawText.split('\n').filter(line => line.trim().length > 0);

  return lines.map((line, index) => {
    // 💡 가장 중요한 부분: 줄 전체를 파일명으로 사용하되 공백만 제거
    const fileName = line.trim();

    // │ 기호를 기준으로 정보 나누기
    const pureText = fileName.replace(/\.[^/.]+$/, ""); // 확장자 제거
    const parts = pureText.split("│").map(p => p.trim());

    return {
      id: index + 1,
      title: parts[0] || "무제",
      size: parts[1] || "정보 없음",
      medium: parts[2] || "Mixed Media",
      year: parts[3] || "2024",
      category: index < 5 ? "Recent" : (index % 2 === 0 ? "Series" : "Nature"),
      fileName: fileName // 여기서 저장된 이름이 getSafePath로 전달됩니다.
    };
  });
};

const ARTWORKS = generateArtworks(RAW_TEXT_LIST).sort((a, b) => {
  if (a.year.includes('2024') && !b.year.includes('2024')) return -1;
  if (!a.year.includes('2024') && b.year.includes('2024')) return 1;
  return 0;
});

const ARTIST_INFO = {
  name: "신은영",
  engName: "Shin Eun Young",
  philosophy: "틈과 틈 사이에 서서, 보이지 않는 울림을 그리다.",
  bio: "21회의 개인전과 수많은 단체전을 통해 자신만의 독창적인 예술 세계를 구축해왔습니다. '틈', '달팽이의 꿈' 등 서정적이고 추상적인 주제를 통해 현대인에게 위로와 성찰의 시간을 선사합니다.",
  email: "seyart@naver.com",
  naverProfile: "https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=bjky&pkid=1&os=33617600&qvt=0&query=%EC%9E%91%EA%B0%80%20%EC%8B%A0%EC%9D%80%EC%98%81",
  address: "경기도 남양주시 화도읍 북한강로 1512 (아르템갤러리)",
  social: {
    instagram: "https://instagram.com/eunyoung2164",
    id: "@eunyoung2164"
  }
};

const SOLO_EXHIBITIONS = [
  { year: "2025", title: "충청각 개인전" },
  { year: "2024", title: "인사동 인사아트센터 개인전" },
  { year: "2024", title: "예인갤러리 초대개인전" },
  { year: "2024", title: "안녕 인사동 아트플러스갤러리 초대개인전" },
  { year: "2023", title: "파주 한빛중학교 초대개인전" },
  { year: "2023", title: "춘천 갤러리 오르 초대개인전" },
  { year: "2022", title: "혜화 마로니에 갤러리 초대개인전" },
  { year: "2022", title: "충무로 아르템갤러리 초대개인전" },
  { year: "2021", title: "오늘제빵소카페 갤러리 초대개인전" },
  { year: "2020", title: "인사동 라메르 갤러리 '틈과 틈 사이에 서서'" },
  { year: "2019", title: "인사동 조형갤러리 '틈' 개인전" },
  { year: "2018", title: "부산시설공단 갤러리 '달팽이의 꿈'" },
  { year: "2017", title: "서울시립미술관 경희궁 분관 개인전" },
  { year: "2016", title: "뉴욕 아트모라 갤러리 초대전" },
  { year: "2015", title: "가나인사아트센터 개인전" },
];

const DRAMA_WORKS = [
  "진짜가 나타났다!", "우아한 제국", "황금가면", "빨강구두", "누가 뭐래도", "오! 삼광빌라", "괴리와 냉소"
];

const PRESS_ARTICLES = [
  { source: "ABC뉴스", title: "기하학적 질서와 본능적 에너지의 조화, 신은영의 추상 세계", url: "https://www.abcn.kr/news/articleView.html?idxno=77983" },
  { source: "비즈한국", title: "신은영 작가, 희로애락을 붓질에 담다", url: "https://www.bizhankook.com/bk/article/27738" },
  { source: "스타데일리뉴스", title: "서양화가 신은영, 인사동 아트플러스갤러리 '쉴, 틈' 개인전 개최", url: "https://www.stardailynews.co.kr/news/articleView.html?idxno=434025" },
  { source: "데일리한국", title: "영산대 공동제작 드라마에 유명 미술작가 대거 참여 '눈길'", url: "https://daily.hankooki.com/news/articleView.html?idxno=1122037" },
  { source: "국제뉴스", title: "ARTEM(아르템) 갤러리 8일 개관...신은영 작가 개인전 오는 30일까지", url: "https://www.gukjenews.com/news/articleView.html?idxno=2444311" },
  { source: "스타뉴스", title: "화가 신은영, 서울·부산 초대전..한, 중 작가들 우정전시도", url: "http://star.mt.co.kr/stview.php?no=2018071309110081974" },
  { source: "뉴스타운", title: "작가 신은영, 25일 한중미술협회전 참가", url: "http://www.newstown.co.kr/news/articleView.html?idxno=313159" },
  { source: "스타뉴스", title: "차홍규-신은영 2인전, 27~28일 더케이호텔서", url: "http://star.mt.co.kr/stview.php?no=2017112409174152392" }
];

const ROOM_SCENES = [
  { id: 'living', name: '거실', img: '/livingroom.jpg', wallPos: { top: 32, left: 50 } },
  { id: 'cafe', name: '카페', img: '/cafe.jpg', wallPos: { top: 35, left: 50 } },
  { id: 'gallery', name: '사무실', img: '/hallway.png', wallPos: { top: 35, left: 50 } },
];

const ArtworkCard = ({ art, onClick, isScrolling }) => {
  const [aspect, setAspect] = useState('square');
  const imageSrc = getSafePath('works', art.fileName);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setAspect(ratio < 0.8 ? 'portrait' : ratio > 1.25 ? 'landscape' : 'square');
    };
  }, [imageSrc]);

  return (
    <div
      className={`flex-shrink-0 p-2 ${aspect === 'portrait' ? "h-[500px] md:h-[640px]" : "h-[240px] md:h-[310px]"} cursor-pointer group w-fit touch-manipulation relative z-10`}
      onClick={(e) => {
        if (isScrolling) return;
        onClick({ ...art, aspect });
      }}
    >
      <div className="relative h-full bg-white overflow-hidden flex items-center justify-center pointer-events-none">
        {/* 💡 md:group-hover를 써서 모바일에서는 커지지 않게 수정했습니다 */}
        <div className="relative h-full w-auto flex items-center justify-center transition-transform duration-500 md:group-hover:scale-105">
          <img
            src={imageSrc}
            alt={art.title}
            className="h-full w-auto object-contain select-none pointer-events-none"
            onError={(e) => { e.target.src = getPlaceholderSrc(); }}
          />
          {/* 오버레이도 PC에서만 보이거나 클릭 시에만 잠깐 보이도록 md: 사용 */}
          <div className="absolute inset-0 bg-neutral-900/0 md:group-hover:bg-neutral-900/80 transition-all duration-500 flex items-center justify-center opacity-0 md:group-hover:opacity-100">
            <div className="text-center text-white p-4">
              <p className="text-[8px] md:text-[10px] tracking-[0.4em] mb-1 font-light text-neutral-400 uppercase">{art.year}</p>
              <h4 className="text-xs md:text-sm font-serif">{art.title}</h4>
            </div>
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

  const [activeRoomBrightness, setActiveRoomBrightness] = useState(128);
  const [calculatedSize, setCalculatedSize] = useState({ width: 0, height: 0 });

  const sliderRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [pressStartTime, setPressStartTime] = useState(0);
  const requestRef = useRef(); // 💡 자동 흐름 애니메이션용

  const newsSliderRef = useRef(null);
  const [isNewsDown, setIsNewsDown] = useState(false);
  const [newsStartX, setNewsStartX] = useState(0);
  const [newsScrollLeft, setNewsScrollLeft] = useState(0);

  const [simScale, setSimScale] = useState(1);
  const [simPos, setSimPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 90도 회전 상태 추가
  const [isDragging, setIsDragging] = useState(false); // 드래그 상태 추가
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleSimMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - simPos.x, y: e.clientY - simPos.y });
  };

  const handleSimMouseMove = (e) => {
    if (!isDragging) return;
    setSimPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleSimMouseUp = () => setIsDragging(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getBrightness(activeRoom.img, setActiveRoomBrightness);
  }, [activeRoom]);

  useEffect(() => {
    if (selectedArt) {
      const { width, height } = parseArtworkSize(selectedArt.size);

      // 실제 이미지의 원본 비율을 읽어와서 높이를 자동 재계산
      const img = new Image();
      img.src = getSafePath('works', selectedArt.fileName);
      img.onload = () => {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const scaleFactor = 1.8;
        setCalculatedSize({
          width: width * scaleFactor,
          height: (width * scaleFactor) / imgRatio, // 비율에 맞춘 정확한 높이
        });
      };

      setSimScale(1); setSimPos({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [selectedArt]);


  const categories = ['All', 'Recent', 'Series', 'Nature'];
  const filteredArtList = useMemo(() =>
    activeCategory === 'All' ? ARTWORKS : ARTWORKS.filter(art => art.category === activeCategory)
    , [activeCategory]);
  const loopList = useMemo(() => [...filteredArtList, ...filteredArtList, ...filteredArtList], [filteredArtList]);
  const animate = () => {
    if (!isDown && !selectedArt && sliderRef.current) {
      sliderRef.current.scrollLeft += 1; // 흐르는 속도 조절 (1: 보통, 2: 빠름)

      // 끝까지 가면 중앙으로 순간이동 (무한 루프)
      const maxScroll = sliderRef.current.scrollWidth / 3;
      if (sliderRef.current.scrollLeft >= maxScroll * 2) {
        sliderRef.current.scrollLeft = maxScroll;
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isDown, selectedArt]);

  const handleStart = (e) => {
    setIsDown(true);
    setIsMoving(false);
    setPressStartTime(Date.now());
    const pageX = e.pageX || e.touches?.[0].pageX;
    setStartX(pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseDown = (e) => {
    setIsDown(true);
    setIsMoving(false);
    setPressStartTime(Date.now()); // 누르기 시작한 시간 저장

    const pageX = e.pageX || e.touches?.[0].pageX;
    const pageY = e.pageY || e.touches?.[0].pageY;

    setStartX(pageX - (sliderRef.current?.offsetLeft || 0));
    setStartY(pageY);
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;

    const pageX = e.pageX || e.touches?.[0].pageX;
    const pageY = e.pageY || e.touches?.[0].pageY;
    const x = pageX - (sliderRef.current?.offsetLeft || 0);

    // 모바일 지터를 감안하여 임계값을 15px로 상향
    const diffX = Math.abs(x - startX);
    const diffY = Math.abs(pageY - startY);

    if (diffX > 15 || diffY > 15) {
      setIsMoving(true);
    }

    if (isMoving) {
      // 드래그 중일 때만 애니메이션 일시 중지하도록 로직이 연결됨
      const walk = (x - startX) * 2;
      if (sliderRef.current) {
        sliderRef.current.scrollLeft = scrollLeft - walk;
      }
    }
  };

  const handleMouseUp = (e) => {
    // 클릭 시간이 짧으면(200ms 미만) 무조건 클릭으로 간주하여 isMoving 강제 해제
    const pressDuration = Date.now() - pressStartTime;
    if (pressDuration < 200) {
      setIsMoving(false);
    }

    setIsDown(false);
    // 약간의 지연 시간을 주어 ArtworkCard의 onClick이 먼저 실행되게 함
    setTimeout(() => setIsMoving(false), 50);
  };

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
        body: JSON.stringify({
          service_id: env.VITE_EMAILJS_SERVICE_ID, template_id: env.VITE_EMAILJS_TEMPLATE_ID, user_id: env.VITE_EMAILJS_PUBLIC_KEY,
          template_params: { from_name: contactData.name, from_email: contactData.email, phone: contactData.phone, message: contactData.message, type: "포트폴리오 고객 문의" }
        })
      });
      if (response.ok) { alert("메시지가 성공적으로 전송되었습니다."); setContactData({ name: '', email: '', phone: '', message: '' }); }
    } catch (error) { alert("전송 중 오류가 발생했습니다."); } finally { setIsSending(false); }
  };

  const handleInquiryRequest = (art) => {
    // 💡 1. 문의 양식(message)에 클릭한 작품의 정보를 자동으로 채워넣습니다.
    setContactData({
      ...contactData,
      message: `안녕하세요. [${art.title}] 작품에 대한 소장 문의드립니다.\n(사이즈: ${art.size} / 제작년도: ${art.year})`
    });

    // 2. 열려있는 작품 상세 창(모달)을 닫습니다.
    setSelectedArt(null);

    // 3. 창이 완전히 닫힐 시간을 잠깐(0.3초) 준 뒤, 입력 폼으로 이동합니다.
    setTimeout(() => {
      // 'contact-form' ID가 있는 곳으로 부드럽게 스크롤합니다.
      const contactSection = document.getElementById('contact-form');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleMove = (e) => {
    if (!isDown) return;
    const pageX = e.pageX || e.touches?.[0].pageX;
    const x = pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // 드래그 감도

    if (Math.abs(walk) > 10) {
      setIsMoving(true);
      if (e.cancelable) e.preventDefault();
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleEnd = () => {
    if (Date.now() - pressStartTime < 200) setIsMoving(false);
    setIsDown(false);
  };


  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-100">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        @keyframes modalEntry {
          0% { opacity: 0; transform: scale(0.98) translateY(10px); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        .animate-modal {
          animation: modalEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          touch-action: pan-y; /* 수직 스크롤은 브라우저에 맡기고 수평 터치 간섭 방지 */
        }
        html { scroll-behavior: smooth; }
        .custom-scrollbar::-webkit-scrollbar { height: 3px; width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        h1, h2, h3, .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      `}</style>

      {/* --- 내비게이션 바 위치 찾기 --- */}
      <nav className={`fixed w-full z-[150] transition-all duration-700 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-neutral-100 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div className="group cursor-pointer">
            <h1 className="text-1xl md:text-xl font-light tracking-[0.3em] md:tracking-[0.4em] uppercase">{ARTIST_INFO.engName}</h1>
            <p className="text-[7px] md:text-[8px] tracking-[0.5em] text-neutral-400 mt-0.5 uppercase font-bold">Contemporary Art</p>
          </div>

          {/* 데스크탑 메뉴 (글자 크기 미세 조정) */}
          <div className="hidden md:flex space-x-10 text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-400">
            {['Home', 'About', 'Gallery', 'Exhibition', 'Media', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-neutral-900 transition-colors relative group">{item}</a>
            ))}
          </div>

          {/* 모바일에서만 보이는 메뉴 버튼 */}
          <button className="md:hidden p-2 text-neutral-800" onClick={() => setIsMenuOpen(true)}>
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* 💡 모바일 전용 전체화면 메뉴 (이 부분을 nav 바로 밑에 넣어주세요) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <button className="absolute top-6 right-6 p-2 text-neutral-900" onClick={() => setIsMenuOpen(false)}>
            <X size={28} strokeWidth={1} />
          </button>
          <div className="flex flex-col items-center gap-8">
            {['Home', 'About', 'Gallery', 'Exhibition', 'Media', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-serif tracking-[0.2em] uppercase text-neutral-800 hover:text-neutral-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      )}


      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden px-8 bg-neutral-100">
        {/* 배경 이미지 레이어 */}
        <div className="absolute inset-0 z-0">
          <img
            src={`${BASE_URL}main_bg.png`}
            alt="Main Background"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>
        </div>

        {/* 메인 텍스트 콘텐츠 */}
        <div className="relative z-10 text-center space-y-10">
          <div className="space-y-4">
            <p className="text-neutral-800 tracking-[0.6em] uppercase text-[10px] font-bold">Portfolio & Archive</p>
            <h2 className="text-5xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.3em] md:tracking-[0.6em] leading-none text-neutral-900 translate-x-[0.15em] md:translate-x-[0.3em] whitespace-nowrap">
              신은영
            </h2>
          </div>
          <div className="h-px w-12 bg-neutral-400 mx-auto"></div>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-neutral-500 font-serif font-light italic leading-relaxed px-4 break-keep">
            "{ARTIST_INFO.philosophy}"
          </p>
        </div>

        {/* 하단 둥둥 화살표 버튼 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
          {/* 허전함을 채워줄 텍스트 가이드 */}
          <span className="text-[9px] tracking-[0.8em] uppercase font-bold text-neutral-500 ml-[0.8em]">
            Scroll
          </span>

          {/* 더 선명해진 화살표 */}
          <a
            href="#about"
            className="text-neutral-800 hover:text-black transition-all duration-500 animate-bounce group"
            aria-label="Scroll Down"
          >
            <ChevronDown size={36} strokeWidth={1} />
          </a>

          {/* 하단 세로선 디자인 포인트 */}
          <div className="w-px h-12 bg-neutral-200/60 mt-2"></div>
        </div>
      </section>

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
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-6">
                <h4 className="text-4xl md:text-5xl font-serif tracking-tight whitespace-nowrap">{ARTIST_INFO.name}</h4>
                <p className="text-neutral-300 text-sm md:text-lg font-light tracking-[0.2em] uppercase">{ARTIST_INFO.engName}</p>
              </div>
              <a href={ARTIST_INFO.naverProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-[9px] border border-neutral-200 text-neutral-400 px-5 py-2.5 rounded-full font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all duration-500">
                <Search size={12} /> 네이버 프로필 보기
              </a>
            </div>
            <p className="text-base md:text-lg lg:text-xl text-neutral-600 font-light leading-relaxed text-left break-keep">
              {ARTIST_INFO.bio}
            </p>
            <div className="pt-8 border-t border-neutral-100 grid grid-cols-2 gap-9 text-left">
              <div className="space-y-2">
                <p className="text-[10px] text-neutral-300 uppercase tracking-widest font-bold">소속</p>
                <p className="text-sm font-medium">청색회 사무국장</p>
                <p className="text-sm font-medium">한국미술전업작가협회 이사</p>
                <p className="text-sm font-medium">한국미술협회 서양화 1분과 이사</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-neutral-300 uppercase tracking-widest font-bold">활동</p>
                <p className="text-sm font-medium">서울아카데미회</p>
                <p className="text-sm font-medium">서울미술협회</p>
                <p className="text-sm font-medium">중랑미술협회</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="py-40 bg-white overflow-hidden text-left">
        <div className="container mx-auto px-8 mb-20 flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-4">
            <span className="text-neutral-300 tracking-[0.4em] uppercase text-[10px] font-bold">Selected Works</span>
            <h3 className="text-4xl md:text-5xl font-serif tracking-tight leading-tight">작품 목록</h3>
          </div>
        </div>
        <div
          ref={sliderRef}
          className="overflow-x-auto no-scrollbar h-[520px] md:h-[680px] relative select-none cursor-grab active:cursor-grabbing"
          onPointerDown={handleStart}
          onPointerMove={handleMove}
          onPointerUp={handleEnd}
          onPointerLeave={handleEnd}
        >
          <div className="flex flex-col flex-wrap content-start h-full gap-4 px-4 w-max">
            {loopList.map((art, idx) => (
              <ArtworkCard
                key={`${art.id}-${idx}`}
                art={art}
                isScrolling={isMoving}
                onClick={(a) => setSelectedArt(a)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="exhibition" className="py-40 bg-neutral-50 text-left border-y border-neutral-100">
        <div className="container mx-auto px-8 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-24">
          <div className="lg:col-span-1 space-y-8">
            <span className="text-neutral-400 tracking-[0.4em] uppercase text-[10px] font-bold">Timeline</span>
            <h4 className="text-4xl md:text-5xl font-serif tracking-tight leading-tight">전시 이력</h4>
            <p className="text-neutral-400 font-light leading-relaxed text-sm">
              21여 회의 개인전과 수많은 단체전을 통해<br />이어온 예술적 행보의 기록입니다.
            </p>
          </div>
          <div className="lg:col-span-2 border-l border-neutral-200 ml-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-12 text-left">
            {SOLO_EXHIBITIONS.map((ex, idx) => (
              <div key={idx} className="relative pl-10 md:pl-16 pb-10 md:pb-16 group last:pb-0">
                <div className="absolute left-0 top-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-neutral-200 border border-white rounded-full -translate-x-1/2 group-hover:bg-neutral-900 transition-all duration-500"></div>
                <span className="text-[10px] md:text-[10px] tracking-[0.3em] text-neutral-300 font-bold uppercase mb-1 block">{ex.year}</span>
                <h5 className="text-lg md:text-lg font-serif text-neutral-700 group-hover:text-neutral-900 transition-colors leading-snug">
                  {ex.title}
                </h5>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="media" className="py-40 bg-neutral-900 text-white overflow-hidden text-left">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="flex flex-col gap-16 mb-20 text-left">
            <div className="space-y-12">
              <div className="space-y-4">
                <span className="text-neutral-500 tracking-[0.5em] uppercase text-[10px] font-bold">Collaborations</span>
                <h3 className="text-4xl md:text-5xl font-serif tracking-tight leading-tight">드라마 협찬 작품</h3>
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

          {/* 언론 보도 섹션: 배경색 수치를 조정하여 렌더링 아티팩트(대각선 선) 방지 */}
          <div className="space-y-16 border-t border-white/5 pt-20 relative group/news-section">
            <div className="flex justify-between items-end px-2">
              <div className="space-y-4 text-left">
                <span className="text-neutral-500 tracking-[0.5em] uppercase text-[10px] font-bold">Journal</span>
                <h3 className="text-4xl md:text-5xl font-serif tracking-tight leading-tight">언론 보도</h3>
              </div>
              <div className="flex gap-2 md:gap-4">
                <button onClick={() => scrollNews('left')} className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-neutral-900 transition-all"><ChevronLeft size={18} /></button>
                <button onClick={() => scrollNews('right')} className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-neutral-900 transition-all"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div ref={newsSliderRef} className="flex overflow-x-auto pb-8 gap-5 md:gap-8 snap-x no-scrollbar">
              {PRESS_ARTICLES.map((article, i) => (
                <a key={i} href={article.url} className="min-w-[260px] sm:min-w-[300px] md:min-w-[380px] ...">
                  <Newspaper className="text-neutral-500 mb-8 group-hover:text-neutral-300 transition-colors" size={28} strokeWidth={1} />
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-4">{article.source}</p>
                  <h5 className="text-lg font-serif leading-relaxed text-neutral-300 group-hover:text-white transition-all h-14 overflow-hidden">{article.title}</h5>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-40 bg-white text-left">
        <div className="container mx-auto px-8 max-w-6xl flex flex-col md:flex-row gap-40">
          <div className="md:w-2/5 space-y-16">
            <div className="space-y-6">
              <span className="text-neutral-300 tracking-[0.4em] uppercase text-[10px] font-bold">Communication</span>
              <h3 className="text-4xl md:text-6xl font-serif tracking-tight leading-tight">문의하기</h3>
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
          <div id="contact-form" className="md:w-3/5 bg-neutral-50 p-12 md:p-16 border border-neutral-100 rounded-sm scroll-mt-32">
            <form className="space-y-8" onSubmit={handleContactSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <input required value={contactData.name} onChange={(e) => setContactData({ ...contactData, name: e.target.value })} type="text" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors" placeholder="성함" />
                <input required value={contactData.email} onChange={(e) => setContactData({ ...contactData, email: e.target.value })} type="email" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors" placeholder="이메일" />
              </div>
              <input required value={contactData.phone} onChange={(e) => setContactData({ ...contactData, phone: e.target.value })} type="tel" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors" placeholder="연락처" />
              <textarea required value={contactData.message} onChange={(e) => setContactData({ ...contactData, message: e.target.value })} rows="5" className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm outline-none focus:border-neutral-900 transition-colors resize-none" placeholder="내용을 입력해주세요"></textarea>
              <button disabled={isSending} type="submit" className="w-full bg-neutral-900 text-white p-5 text-sm tracking-[0.4em] font-bold uppercase flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-xl">
                {isSending ? <Loader2 className="animate-spin" size={16} /> : "메시지 보내기"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="py-24 bg-neutral-50 text-center border-t border-neutral-100">
        <h2 className="text-lg font-serif tracking-[0.4em] uppercase mb-10 text-neutral-300">{ARTIST_INFO.engName}</h2>
        <div className="flex justify-center gap-12 text-[9px] uppercase tracking-[0.5em] font-bold text-neutral-300 mb-12">
          <a href="#home" className="hover:text-neutral-900 transition-colors">Home</a>
          <a href="#gallery" className="hover:text-neutral-900 transition-colors">Gallery</a>
          <a href="#contact" className="hover:text-neutral-900 transition-colors">Contact</a>
        </div>
        <p className="text-[9px] text-neutral-300 uppercase tracking-[0.4em]">© 2024 Artist Shin Eun Young. Portfolio.</p>
      </footer>

      {selectedArt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-white/90 backdrop-blur-md animate-modal overflow-hidden text-left">
          {/* 닫기 버튼 */}
          <button
            className="absolute top-6 right-6 z-[310] text-neutral-900 hover:rotate-90 transition-transform duration-200"
            onClick={() => setSelectedArt(null)}
          >
            <X size={32} strokeWidth={1} />
          </button>
          <div className="container mx-auto max-w-6xl h-full flex flex-col">
            <div className="flex justify-center gap-10 mt-10 mb-10 border-b border-neutral-50 shrink-0">
              <button onClick={() => setPreviewMode('info')} className={`pb-4 text-[10px] tracking-[0.4em] uppercase font-bold transition-all ${previewMode === 'info' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-300'}`}>Work Detail</button>
              <button onClick={() => setPreviewMode('simulation')} className={`pb-4 text-[10px] tracking-[0.4em] uppercase font-bold transition-all ${previewMode === 'simulation' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-300'}`}>가상 배치</button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              {previewMode === 'info' ? (
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-24 items-center min-h-full py-4 px-4 overflow-y-auto">
                  {/* 이미지 영역: 모바일에서 높이 제한 강화 */}
                  <div className="w-full lg:w-[55%] bg-neutral-50 p-4 md:p-12 flex items-center justify-center shadow-lg border border-neutral-100 overflow-hidden rounded-sm">
                    <img
                      src={getSafePath('works', selectedArt.fileName)}
                      alt={selectedArt.title}
                      className="max-w-full max-h-[40vh] md:max-h-[65vh] object-contain shadow-2xl"
                      onError={(e) => { e.target.src = getPlaceholderSrc(); }}
                    />
                  </div>
                  {/* 텍스트 영역: 글자 크기 축소 및 간격 조절 */}
                  <div className="w-full lg:w-[45%] space-y-6 md:space-y-10 text-left pb-10">
                    <div className="space-y-2">
                      <p className="text-[10px] text-neutral-300 tracking-[0.3em] uppercase font-bold">{selectedArt.year}</p>
                      <h3 className="text-3xl md:text-5xl font-serif tracking-tight leading-snug break-keep">
                        {selectedArt.title}
                      </h3>
                      <p className="text-sm md:text-lg text-neutral-400 italic font-serif font-light">{selectedArt.medium}</p>
                    </div>
                    <div className="py-4 md:py-8 border-y border-neutral-50 text-[9px] md:text-[11px] flex justify-between items-center uppercase tracking-widest font-bold">
                      <span className="text-neutral-300">Dimensions</span>
                      <span className="text-neutral-900 font-serif text-sm md:text-lg">{selectedArt.size}</span>
                    </div>
                    <button
                      onClick={() => handleInquiryRequest(selectedArt)}
                      className="w-full bg-neutral-900 text-white py-4 md:py-6 text-[10px] md:text-[12px] tracking-[0.3em] font-bold uppercase hover:bg-neutral-800 transition-all rounded-sm shadow-lg"
                    >
                      작품 소장 문의하기
                    </button>
                  </div>
                </div>
              ) : (
                /* --- 가상 배치(Simulation) 뷰 시작 --- */
                <div
                  className="flex flex-col items-center gap-4 md:gap-8 py-2 md:py-6 min-h-full text-center px-2 md:px-4 select-none"
                  onMouseMove={handleSimMouseMove}
                  onMouseUp={handleSimMouseUp}
                  onMouseLeave={handleSimMouseUp}
                >
                  {/* 1. 상단 방 선택 버튼 (모바일에서 더 작고 촘촘하게) */}
                  <div className="flex flex-wrap justify-center gap-1.5 md:gap-4 mt-2">
                    {ROOM_SCENES.map(room => (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoom(room)}
                        className={`px-3 md:px-8 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] tracking-widest uppercase font-bold border transition-all duration-700 ${activeRoom.id === room.id ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-100 text-neutral-300'}`}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>

                  {/* 2. 메인 시뮬레이션 영역 */}
                  <div className="relative w-full max-w-5xl aspect-video bg-neutral-100 shadow-inner overflow-hidden rounded-sm border border-neutral-50 cursor-default">
                    <img
                      src={`${BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/'}${activeRoom.img.startsWith('/') ? activeRoom.img.slice(1) : activeRoom.img}`}
                      alt={activeRoom.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* 작품 프레임: 모바일 가독성을 위해 크기 계산 보정 */}
                    <div
                      onMouseDown={handleSimMouseDown}
                      className="absolute shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border-[2px] md:border-[4px] border-white transition-transform duration-75 ease-out cursor-grab active:cursor-grabbing"
                      style={{
                        top: `${activeRoom.wallPos.top}%`,
                        left: `${activeRoom.wallPos.left}%`,
                        // 화면 너비에 따라 기본 스케일을 0.5~1.0 사이로 자동 조절
                        width: `${(calculatedSize.width * simScale) * (window.innerWidth < 768 ? 0.5 : 1)}px`,
                        height: `${(calculatedSize.height * simScale) * (window.innerWidth < 768 ? 0.5 : 1)}px`,
                        transform: `translate(calc(-50% + ${simPos.x}px), calc(-50% + ${simPos.y}px)) rotate(${rotation}deg)`,
                      }}
                    >
                      <img
                        src={getSafePath('works', selectedArt.fileName)}
                        alt={selectedArt.title}
                        className="w-full h-full object-contain pointer-events-none"
                        onError={(e) => { e.target.src = getPlaceholderSrc(); }}
                      />
                    </div>

                    {/* 3. 하단 컴팩트 컨트롤 패널 (모바일 최적화 크기) */}
                    <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-1 md:p-2 rounded-full shadow-xl flex items-center gap-1.5 md:gap-2 border border-neutral-100 scale-[0.85] md:scale-100">
                      <div className="flex items-center gap-1 border-r border-neutral-100 pr-1.5">
                        <button onClick={() => setSimScale(prev => Math.max(0.1, prev - 0.1))} className="p-1 md:p-1.5 hover:bg-neutral-50 rounded-full transition-colors"><ZoomOut size={14} /></button>
                        <span className="text-[8px] md:text-[9px] font-bold w-7 md:w-8 text-center">{Math.round(simScale * 100)}%</span>
                        <button onClick={() => setSimScale(prev => Math.min(3, prev + 0.1))} className="p-1 md:p-1.5 hover:bg-neutral-50 rounded-full transition-colors"><ZoomIn size={14} /></button>
                      </div>
                      <button onClick={() => setRotation(prev => prev + 90)} className="p-1 md:p-1.5 hover:bg-neutral-50 rounded-full" title="회전"><RotateCcw size={14} className="rotate-180" /></button>
                      <button onClick={() => { setSimScale(1); setSimPos({ x: 0, y: 0 }); setRotation(0); }} className="p-1 md:p-1.5 hover:bg-neutral-50 rounded-full text-neutral-400"><RotateCcw size={14} /></button>
                    </div>
                  </div>

                  <p className="text-[8px] md:text-[10px] text-neutral-400 font-medium tracking-tight">
                    * 드래그하여 작품을 이동하고 90도 회전할 수 있습니다.
                  </p>
                </div>
                /* --- 가상 배치(Simulation) 뷰 끝 --- */
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;