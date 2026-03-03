import { LocationEdit, PhoneCall, MailIcon, Facebook } from 'lucide-react'
import Link from 'next/link'
export default function HeaderContact(){
    const headerContacts = [
        {icon: LocationEdit, title: "Location", statement: "Phase 3, Payatas B, Quezon City", link: "https://maps.app.goo.gl/c5RPie3VQHuboSDU7"},
        {icon: PhoneCall, title: "Contact number", statement: '09351538415'},
        {icon: MailIcon, title: "Gmail", statement: 'pnapayatas@gmail.com'}
    ]
    
    return(
        <div className="hidden md:block fixed top-0 left-0 right-0 z-101 bg-gray-800 text-white py-2 px-4">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center md:justify-end gap-4 md:gap-8">
                {headerContacts.map((headerContact) => {
                    const IconComponent = headerContact.icon;
                    return (
                        <div key={headerContact.title} className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-red-400 flex-shrink-0" />
                            {
                                headerContact.link ? (
                                    <Link
                                        href={headerContact.link}
                                        target='_blank'
                                        className='text-xs text-gray-200'
                                    >
                                        {headerContact.statement}
                                    </Link>
                                ) : (

                                    <p className="text-xs text-gray-200">{headerContact.statement}</p>
                                )
                            }

                        </div>
                    )
                })}
                <Link
                    href="https://www.facebook.com/pusongama"
                    target='_blank'
                    className='flex items-center justify-center'
                >
                    <Facebook className='h-4 w-4'/>
                    <p className='text-xs'>Puso ng Ama</p>
                    
                </Link>
            </div>
        </div>
    )
}