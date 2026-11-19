import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import FaceCosmos from "@/components/FaceCosmos";
import HeroIntro from "@/components/HeroIntro";
import JourneyStories from "@/components/JourneyStories";
import Journey from "@/components/Journey";
import WordWall from "@/components/WordWall";
import StumpingScene from "@/components/StumpingScene";
import Titles from "@/components/Titles";
import TrophyGallery from "@/components/TrophyGallery";
import MatchInnings from "@/components/MatchInnings";
import FansParallax from "@/components/FansParallax";
import LessonStories from "@/components/LessonStories";
import Closing from "@/components/Closing";
import TributeCardBuilder from "@/components/TributeCardBuilder";
import BuiltBy from "@/components/BuiltBy";
import DearThala from "@/components/DearThala";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SmoothScroll />
      <Header />
      <ThemeSwitcher />
      <div className="col-lines" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <main id="main">
        <FaceCosmos />
        <HeroIntro />
        <JourneyStories />
        <TrophyGallery />
        <MatchInnings />
        <Journey />
        <WordWall />
        <StumpingScene />
        <Titles />
        <FansParallax />
        <LessonStories />
        <Closing />
        <TributeCardBuilder />
        <BuiltBy />
        <DearThala />
      </main>
      <Footer />
    </>
  );
}
