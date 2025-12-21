export default function About() {
  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              About <span className="gradient-text">Me</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="glass rounded-2xl p-8 md:p-12 space-y-6 hover:shadow-2xl transition-all duration-300">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              I am a Computer Engineering graduate looking forward to making a difference and solving issues through software development. I enjoy working in an environment with others, learning from experienced people, and continually improving my ability.
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              I learn and build with modern web technologies including React, Node.js, and 
              MongoDB. I love tackling complex problems and turning them into simple, 
              beautiful solutions. When I'm not coding, you'll find me exploring new 
              technologies, solving DSA problems on Leetcode with Java, or expanding my knowledge.
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Currently, I'm focused on learning  GenAI, DSA with Java & Cloud technologies to expand my skill set and stay updated with industry trends. 
            </p>

            <div className="grid md:grid-cols-3 gap-6 pt-6">
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold gradient-text">7+</p>
                <p className="text-gray-600 dark:text-gray-400">Built Projects</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold gradient-text">1.5+</p>
                <p className="text-gray-600 dark:text-gray-400">Internship Experience (Yrs)</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold gradient-text">10+</p>
                <p className="text-gray-600 dark:text-gray-400">Technologies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}