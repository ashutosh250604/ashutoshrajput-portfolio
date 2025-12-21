import Hero from '@/components/Hero'
import About from '@/components/About'
import ProjectsGrid from '@/components/ProjectsGrid'
import ExperienceList from '@/components/ExperienceList'
import SkillsList from '@/components/SkillsList'
import ContactSection from '@/components/ContactSection'

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <ProjectsGrid />
      <ExperienceList />
      <SkillsList />
      <ContactSection />
    </>
  )
}