import Carousel from '@/components/Hero/Carousel';
import FAQ from '@/components/Hero/FAQ';
import HeroPage from '@/components/Hero/HeroPage';
import HowItWorks from '@/components/Hero/HowItWorks';
interface CarouselItem {
  id: number;
  name: string;
  company: string;
  package: string;
  image: string;
  logo: string;
  location: string;
  year: string;
  rating: number;
  role: string;
}

export default function Home() {
  const defaultItems: CarouselItem[] = [
    {
      id: 1,
      name: 'Rahul Sharma',
      company: 'Google',
      package: '₹45 LPA',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
      logo: 'google',
      location: 'Bangalore',
      year: '2024',
      rating: 5,
      role: 'Software Engineer',
    },
    {
      id: 3,
      name: 'Arjun Kumar',
      company: 'Amazon',
      package: '₹38 LPA',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      logo: 'amazon',
      location: 'Mumbai',
      year: '2024',
      rating: 4,
      role: 'Data Scientist',
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      company: 'Apple',
      package: '₹50 LPA',
      image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop',
      logo: 'apple',
      location: 'Delhi',
      year: '2024',
      rating: 5,
      role: 'iOS Developer',
    },
    {
      id: 5,
      name: 'Vikram Singh',
      company: 'Meta',
      package: '₹48 LPA',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      logo: 'meta',
      location: 'Gurgaon',
      year: '2024',
      rating: 5,
      role: 'Frontend Engineer',
    },
    {
      id: 6,
      name: 'Ananya Joshi',
      company: 'Netflix',
      package: '₹44 LPA',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=600&fit=crop',
      logo: 'netflix',
      location: 'Pune',
      year: '2024',
      rating: 4,
      role: 'UX Designer',
    },
  ];
  return (
    <div className="relative z-10 min-h-screen w-full bg-white dark:bg-white dark:text-white">
      <HeroPage />
      <HowItWorks />
      <Carousel items={defaultItems} />
      <FAQ />
    </div>
  );
}
