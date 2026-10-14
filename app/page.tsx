import Hero from '@/components/Hero'
import About from '@/components/About'
import ProjectsList from '@/components/ProjectsList'
import ExperienceList from '@/components/ExperienceList'
import SkillsList from '@/components/SkillsList'
import ContactSection from '@/components/ContactSection'

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <ProjectsList />
      <ExperienceList />
      <SkillsList />
      <ContactSection />
    </>
  )
}
