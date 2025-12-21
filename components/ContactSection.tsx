import { Mail, MapPin, Phone } from 'lucide-react'
import SocialBar from './SocialBar'

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-12 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Get In <span className="gradient-text">Touch</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-8 space-y-6 hover:shadow-xl transition-all">
                <h3 className="text-2xl font-bold mb-4">Let's Connect</h3>
                
                <a
                  href="mailto:ashutoshrajput2506@gmail.com"
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="p-3 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                    <Mail className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ashutoshrajput2506atgmaildotcom
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 rounded-lg">
                  <div className="p-3 bg-primary-500/10 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Location</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      India
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Ping me on social media
                  </p>
                  <SocialBar />
                </div>
              </div>
            </div>

            {/* Quick Message CTA */}
            <div className="glass rounded-xl p-8 flex flex-col justify-center hover:shadow-xl transition-all">
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">Let's Connect !</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Whether you have a question or just want to say hi, I'll get back to you in a second 😅!
                  </p>
                </div>

                <a
                  href="mailto:ashutoshrajput2506@gmail.com?subject=Let's%20Connect"
                  className="inline-block px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:shadow-lg hover:scale-105 font-semibold"
                >
                  Send Me an Email
                </a>

                <a
                  href="/resume.pdf"
                  download
                  className="inline-block px-8 py-3 glass rounded-lg hover:shadow-lg transition-all hover:scale-105 font-semibold"
                >
                  Download Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}