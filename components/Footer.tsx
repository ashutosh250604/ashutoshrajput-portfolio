export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 py-8 px-4 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
            © {currentYear} | Built with Next.js & Tailwind CSS
          </p>
          
          <div className="flex gap-6">
            <a
              href="https://github.com/ashutosh250604"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ashutosh-rajput-67326b2b3/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm"
            >
              LinkedIn
            </a>
            <a
              href="/resume.pdf"
              download
              className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm"
            >
              Resume
            </a>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Designed by Ashutosh Rajput
          </p>
        </div>
      </div>
    </footer>
  )
}