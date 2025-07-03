import Header from "@/components/Header";
import FAQ from "@/components/Hero/FAQ";
import HeroPage from "@/components/Hero/HeroPage";
import HowItWorks from "@/components/Hero/HowItWorks";


export default function Home() {
  return (
      <div>
        <Header />
        <HeroPage/>
        <HowItWorks/>
        <FAQ/>
        
      </div>
  );
}
