import Navigation from './components/Navigation'
import './globals.css'


export const metadata = {
  title: 'Chain Gpt',
  description: 'Chain Gpt',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body >
        <div className='flex flex-col min-h-screen'>
          <Navigation />
          
          <main className='flex justify-center container max-w-screen-xl py-5 pl-20'>{children}</main>
          
          <footer className='border-t py-4'>
            <div className='text-sm text-center'>
              CopyRight ©️| KameChannel
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
