import { Graduate, StaffMember } from "@/types/localdb";
import SetImageGoogleById from "@/utils/SetImageGoogleById";
import { Sparkles, BookOpen, Stethoscope, TreePine } from "lucide-react";



function GraduateData(){
    const graduatesData: Graduate[] = [
        {
            id: '1',
            name: 'Yvette Cahanap',
            degree: 'PhD in Computer Science',
            school: 'University of Santo Tomas',
            graduationYear: 2023,
            image: SetImageGoogleById('1ecMufgZ6uo8gpuABK1PPI7qFSivEKlMr'),
            achievements: [''],
            story: ""
        },
        {
            id: '2',
            name: 'Michael Zhang',
            degree: 'Master of Science',
            school: 'Data Science',
            graduationYear: 2023,
            // thesisTitle: 'Big Data Analytics for Healthcare Applications',
            // advisor: 'Dr. Emily Wong',
            // researchArea: 'Data Science, Healthcare Analytics',
            image: SetImageGoogleById('15X_FUa1Njcjk4JEzcNa_zuol7iZ0BEja'),
            achievements: ['Outstanding Research Award'],
            story: "My passion for data science emerged from wanting to solve real-world healthcare challenges. During my master's program, I developed predictive models that could identify patients at risk of chronic diseases with 92% accuracy. This research evolved into a startup that's now partnering with school hospitals to implement preventive care strategies. The collaborative environment and cutting-edge resources at the university were instrumental in transforming my academic project into a life-saving application that's already impacted over 10,000 patients."
        },
        {
            id: '3',
            name: 'Jessica Williams',
            degree: 'Bachelor of Arts',
            school: 'Economics',
            graduationYear: 2023,
            // advisor: 'Dr. James Anderson',
            // researchArea: 'Behavioral Economics',
            image: 'https://drive.google.com/uc?export=view&id=1PxsfyuDIyOXXeoC5eQ4Ni2P79A6mZW1b',
            achievements: ['Summa Cum Laude', 'Departmental Honors'],
            story: "As a first-generation college student, I initially felt overwhelmed by the academic challenges. However, the supportive faculty and diverse perspectives I encountered in the economics program transformed my uncertainty into purpose. My research on how behavioral economics can address wealth inequality earned me the opportunity to present at the American Economic Association conference. This experience led to a position with the Federal Reserve, where I now contribute to policies that make financial systems more equitable. The critical thinking skills I developed continue to guide my work in economic justice."
        },
        {
            id: '4',
            name: 'David Kim',
            degree: 'PhD in Biology',
            school: 'Molecular Biology',
            graduationYear: 2022,
            // thesisTitle: 'Genomic Analysis of Rare Diseases',
            // advisor: 'Dr. Lisa Thompson',
            // researchArea: 'Genomics, Precision Medicine',
            image: 'https://drive.google.com/uc?export=view&id=1f3G3GBab8pKjXKHEblCgfy6op1XENQYh',
            achievements: ['NIH Research Grant', 'Publication in Nature'],
            story: "My PhD journey was deeply personal—my younger sister was diagnosed with a rare genetic disorder that lacked effective treatments. This motivated me to pursue genomics research that could help families like mine. My dissertation focused on identifying novel genetic markers for rare diseases, leading to a diagnostic breakthrough that's now used in clinical settings. The publication of this work in Nature was a milestone, but the real reward has been receiving messages from families who finally have answers. I now lead a research lab dedicated to turning genomic discoveries into tangible therapies for rare disease patients."
        },
        {
            id: '5',
            name: 'Amanda Rodriguez',
            degree: 'Master of Engineering',
            school: 'Electrical Engineering',
            graduationYear: 2023,
            // thesisTitle: 'Renewable Energy Systems Optimization',
            // advisor: 'Dr. William Brown',
            // researchArea: 'Renewable Energy, Smart Grids',
            image: 'https://drive.google.com/uc?export=view&id=1Xg2a1ciS4YDDJ6Qt1ZV_vrLMr3hgFMBp',
            achievements: ['IEEE Best Paper Award'],
            story: "Growing up in a community affected by power outages during extreme weather events inspired my interest in resilient energy systems. My master's research developed optimization algorithms that improve renewable energy integration into existing grids, increasing efficiency by 35% while reducing costs. This work received the IEEE Best Paper Award and attracted attention from national energy agencies. I now work with a clean energy nonprofit, implementing these solutions in underserved communities. The technical skills and ethical framework I gained during my studies continue to guide my mission of creating sustainable energy access for all."
        },
        {
            id: '6',
            name: 'Christopher Lee',
            degree: 'Bachelor of Science',
            school: 'Physics',
            graduationYear: 2023,
            // researchArea: 'Quantum Computing',
            image: 'https://drive.google.com/uc?export=view&id=1f3G3GBab8pKjXKHEblCgfy6op1XENQYh',
            achievements: ['Magna Cum Laude', 'Physics Department Award'],
            story: "My fascination with quantum mechanics began in high school, but it was the undergraduate research opportunities here that truly ignited my passion. I had the privilege of working on quantum computing hardware development, contributing to a project that achieved record coherence times for qubits. This hands-on experience, combined with rigorous theoretical training, prepared me for my current role at a quantum startup. We're working on making quantum computing more accessible—a mission that feels particularly meaningful when I remember my own journey from curious student to contributing researcher. The faculty's commitment to undergraduate research truly set me on this path."
        },
            {
            id: '7',
            name: 'hello Johnson',
            degree: 'PhD in Computer Science',
            school: 'Computer Science',
            graduationYear: 2023,
            // thesisTitle: 'Machine Learning Approaches to Natural Language Processing',
            // advisor: 'Dr. Robert Chen',
            // researchArea: 'Artificial Intelligence, NLP',
            image: 'https://drive.google.com/uc?export=view&id=15X_FUa1Njcjk4JEzcNa_zuol7iZ0BEja',
            achievements: ['Best Dissertation Award', 'Research Excellence Fellowship'],
            story: "My journey in computer science began with a fascination for how machines could understand human language. Under Dr. Chen's mentorship, I developed novel algorithms that improved machine translation accuracy by 40%. My research was published in top-tier conferences and caught the attention of industry leaders. Today, I lead a team at Google developing next-generation NLP tools that break down language barriers for millions of users worldwide. The interdisciplinary approach I learned during my PhD continues to inspire innovative solutions to complex problems."
        },
        {
            id: '8',
            name: 'Michael Zhang',
            degree: 'Master of Science',
            school: 'Data Science',
            graduationYear: 2023,
            // thesisTitle: 'Big Data Analytics for Healthcare Applications',
            // advisor: 'Dr. Emily Wong',
            // researchArea: 'Data Science, Healthcare Analytics',
            image: 'https://drive.google.com/uc?export=view&id=1Xg2a1ciS4YDDJ6Qt1ZV_vrLMr3hgFMBp',
            achievements: ['Outstanding Research Award'],
            story: "My passion for data science emerged from wanting to solve real-world healthcare challenges. During my master's program, I developed predictive models that could identify patients at risk of chronic diseases with 92% accuracy. This research evolved into a startup that's now partnering with school hospitals to implement preventive care strategies. The collaborative environment and cutting-edge resources at the university were instrumental in transforming my academic project into a life-saving application that's already impacted over 10,000 patients."
        },
        {
            id: '9',
            name: 'Jessica Williams',
            degree: 'Bachelor of Arts',
            school: 'Economics',
            graduationYear: 2023,
            // advisor: 'Dr. James Anderson',
            // researchArea: 'Behavioral Economics',
            image: 'https://drive.google.com/uc?export=view&id=1PxsfyuDIyOXXeoC5eQ4Ni2P79A6mZW1b',
            achievements: ['Summa Cum Laude', 'Departmental Honors'],
            story: "As a first-generation college student, I initially felt overwhelmed by the academic challenges. However, the supportive faculty and diverse perspectives I encountered in the economics program transformed my uncertainty into purpose. My research on how behavioral economics can address wealth inequality earned me the opportunity to present at the American Economic Association conference. This experience led to a position with the Federal Reserve, where I now contribute to policies that make financial systems more equitable. The critical thinking skills I developed continue to guide my work in economic justice."
        },
        {
            id: '10',
            name: 'David Kim',
            degree: 'PhD in Biology',
            school: 'Molecular Biology',
            graduationYear: 2022,
            // thesisTitle: 'Genomic Analysis of Rare Diseases',
            // advisor: 'Dr. Lisa Thompson',
            // researchArea: 'Genomics, Precision Medicine',
            image: 'https://drive.google.com/uc?export=view&id=1f3G3GBab8pKjXKHEblCgfy6op1XENQYh',
            achievements: ['NIH Research Grant', 'Publication in Nature'],
            story: "My PhD journey was deeply personal—my younger sister was diagnosed with a rare genetic disorder that lacked effective treatments. This motivated me to pursue genomics research that could help families like mine. My dissertation focused on identifying novel genetic markers for rare diseases, leading to a diagnostic breakthrough that's now used in clinical settings. The publication of this work in Nature was a milestone, but the real reward has been receiving messages from families who finally have answers. I now lead a research lab dedicated to turning genomic discoveries into tangible therapies for rare disease patients."
        },
        {
            id: '11',
            name: 'Amanda Rodriguez',
            degree: 'Master of Engineering',
            school: 'Electrical Engineering',
            graduationYear: 2023,
            // thesisTitle: 'Renewable Energy Systems Optimization',
            // advisor: 'Dr. William Brown',
            // researchArea: 'Renewable Energy, Smart Grids',
            image: 'https://drive.google.com/uc?export=view&id=1Xg2a1ciS4YDDJ6Qt1ZV_vrLMr3hgFMBp',
            achievements: ['IEEE Best Paper Award'],
            story: "Growing up in a community affected by power outages during extreme weather events inspired my interest in resilient energy systems. My master's research developed optimization algorithms that improve renewable energy integration into existing grids, increasing efficiency by 35% while reducing costs. This work received the IEEE Best Paper Award and attracted attention from national energy agencies. I now work with a clean energy nonprofit, implementing these solutions in underserved communities. The technical skills and ethical framework I gained during my studies continue to guide my mission of creating sustainable energy access for all."
        },
        {
            id: '12',
            name: 'Chrisnasduw',
            degree: 'Bachelor of Science',
            school: 'Physics',
            graduationYear: 2023,
            // researchArea: 'Quantum Computing',
            image: 'https://drive.google.com/uc?export=view&id=1f3G3GBab8pKjXKHEblCgfy6op1XENQYh',
            achievements: ['Magna Cum Laude', 'Physics Department Award'],
            story: "My fascination with quantum mechanics began in high school, but it was the undergraduate research opportunities here that truly ignited my passion. I had the privilege of working on quantum computing hardware development, contributing to a project that achieved record coherence times for qubits. This hands-on experience, combined with rigorous theoretical training, prepared me for my current role at a quantum startup. We're working on making quantum computing more accessible—a mission that feels particularly meaningful when I remember my own journey from curious student to contributing researcher. The faculty's commitment to undergraduate research truly set me on this path."
        },
        {
            id: '13',
            name: 'Chrisnasduw',
            degree: 'Bachelor of Science',
            school: 'Physics',
            graduationYear: 2023,
            // researchArea: 'Quantum Computing',
            image: 'https://drive.google.com/uc?export=view&id=1f3G3GBab8pKjXKHEblCgfy6op1XENQYh',
            achievements: ['Magna Cum Laude', 'Physics Department Award'],
            story: "My fascination with quantum mechanics began in high school, but it was the undergraduate research opportunities here that truly ignited my passion. I had the privilege of working on quantum computing hardware development, contributing to a project that achieved record coherence times for qubits. This hands-on experience, combined with rigorous theoretical training, prepared me for my current role at a quantum startup. We're working on making quantum computing more accessible—a mission that feels particularly meaningful when I remember my own journey from curious student to contributing researcher. The faculty's commitment to undergraduate research truly set me on this path."
        }
    ];

    return graduatesData;
}

const programs = [
  {
    title: "Educational Support",
    description: "Quality education for underprivileged children to build a brighter tomorrow.",
    image: SetImageGoogleById("1Zdvb-260r7KoWIbxE1HkORGxDrSz6j8r"),
    icon: BookOpen,
    color: "from-red-700/50 to-red-200/30",
  },
  {
    title: "Health & Wellness",
    description: "Medical assistance and health programs that restore dignity and hope.",
    image: SetImageGoogleById("12_K4JpnlMtfa8BrGA2hZoPQctGpQgzy-"),
    icon: Stethoscope,
    color: "from-red-700/50 to-red-200/30",
  },
  {
    title: "Community Development",
    description: "Building stronger communities through solidarity and shared purpose.",
    image: SetImageGoogleById("1xSH1UyTmhJQeqXR49TZZCaERFG3oOKRa"),
    icon: TreePine,
    color: "from-red-700/50 to-red-200/30",
  },
  {
    title: "Youth Empowerment",
    description: "Empowering young leaders to become instruments of lasting change.",
    image: SetImageGoogleById("1Xr43I3FqqdzMus5fYiJzWJngmedI_QUd"),
    icon: Sparkles,
    color: "from-red-700/50 to-red-200/30",
  },
];


const AboutPage = () => {
    const paragraph = [
        { sentence: 1, description: "In 2005 father Paul Uwemedimo responded to the situation in Payatas and established the PNA foundation which means HEART OF THE FATHER with the aim of personal and social transformation of individuals, families and communities. This is achieved through a child and youth development, education, human and spiritual formation and community development, income generation, health and property ownership.  " },
        { sentence: 2, description: "The mission of PNA is to help people, especially those who are materially poor to experience, know, accept, be reconciled by, be healed by, be transformed by and be compelled to action by God's steadfast, merciful, gracious and infinite love." },
    ]

    const image = [
        { id: 1, image: SetImageGoogleById("1xS-d9IfKvMsFP0VuhO4uH6MuskcqRqzq") },
        { id: 2, image: SetImageGoogleById("1MpfHISqlBDviH1HJqkapbqrlvKRb9XT4") },
        { id: 3, image: SetImageGoogleById("1ooXO5f-M-TWomZpzarTZbZT5wMsdVudz") },
        { id: 4, image: SetImageGoogleById("1uwwKXIZ1BM_m4R400g4a88Smo-8X1IVs") },
        { id: 5, image: SetImageGoogleById("1DJAFP9tPGQJURCTviM5Tb3y7m24PusyG") },
        { id: 6, image: SetImageGoogleById("1Lon5Qf89QEJG0hiLBdijYAAxmDtg51dQ") },
        { id: 7, image: SetImageGoogleById("1lZ9OgSlxEiKyPZ5gZvUTjZTgZK6sxzDw") },
    ]


    return {paragraph, image}
}





const staffMembers: StaffMember[] = [
    {
        id: 1,
        name: 'Fr. Paul Uwemedimo',
        position: 'Founder & Executive Director',
        department: 'Executive',
        email: 'fr.paul@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'Founded Puso Ng Ama Foundation in 2010 with a divine calling to serve the poor and marginalized. A Catholic priest dedicated to spreading God\'s love through compassionate action and community development.',
        expertise: ['Spiritual Leadership', 'Community Development', 'Pastoral Care', 'Non-profit Management'],
        phone: '+63 912 345 6789',
        education: 'Master of Divinity, San Carlos Seminary'
    },
    {
        id: 2,
        name: 'Sister Maria Theresa Santos',
        position: 'Programs Director',
        department: 'Programs',
        email: 'sr.maria@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'A Religious Sister with over 15 years of experience in community organizing and social development. She oversees all foundation programs ensuring they align with the mission of serving the poorest of the poor.',
        expertise: ['Program Management', 'Community Organizing', 'Social Work', 'Women Empowerment'],
        phone: '+63 923 456 7890',
        education: 'MSW, University of Santo Tomas'
    },
    {
        id: 3,
        name: 'Brother Jose Rafael Cruz',
        position: 'Operations Manager',
        department: 'Operations',
        email: 'bro.jose@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'A Lay Franciscan Brother dedicated to serving the poor through efficient program implementation. He ensures that resources reach those who need them most through streamlined operations and logistics.',
        expertise: ['Operations Management', 'Logistics', 'Resource Allocation', 'Volunteer Coordination'],
        phone: '+63 934 567 8901',
        education: 'BS Business Management, De La Salle University'
    },
    {
        id: 4,
        name: 'Dr. Maria Consuelo Reyes',
        position: 'Health Program Coordinator',
        department: 'Health & Wellness',
        email: 'dr.reyes@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'A medical doctor who left private practice to serve underserved communities. She leads our medical missions and health education programs, bringing healthcare to remote barangays.',
        expertise: ['Public Health', 'Medical Missions', 'Health Education', 'Community Medicine'],
        phone: '+63 945 678 9012',
        education: 'MD, University of the Philippines Manila'
    },
    {
        id: 5,
        name: 'Mr. Roberto "Bobby" Mendoza',
        position: 'Youth Formation Director',
        department: 'Youth Empowerment',
        email: 'bobby.mendoza@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'A former youth leader turned formation director, passionate about empowering young people to become agents of change. He develops programs that nurture faith, leadership, and social responsibility.',
        expertise: ['Youth Leadership', 'Formation Programs', 'Values Education', 'Sports Ministry'],
        phone: '+63 956 789 0123',
        education: 'BS Psychology, Ateneo de Manila University'
    },
    {
        id: 6,
        name: 'Ms. Teresita "Tessie" Villanueva',
        position: 'Community Relations Officer',
        department: 'Community Engagement',
        email: 'tessie.villanueva@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'A community development worker who builds bridges between the foundation and the communities we serve. Her deep understanding of local culture helps ensure our programs are culturally sensitive and effective.',
        expertise: ['Community Engagement', 'Cultural Sensitivity', 'Needs Assessment', 'Partnership Building'],
        phone: '+63 967 890 1234',
        education: 'BA Sociology, University of the Philippines Diliman'
    },
    {
        id: 7,
        name: 'Bro. John Paul Fernandez',
        position: 'Spiritual Formation Coordinator',
        department: 'Spiritual Ministry',
        email: 'bro.jp@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'A religious brother dedicated to nurturing the spiritual life of foundation staff and beneficiaries. He organizes retreats, prayer gatherings, and faith formation activities.',
        expertise: ['Spiritual Direction', 'Retreat Facilitation', 'Catechesis', 'Pastoral Counseling'],
        phone: '+63 978 901 2345',
        education: 'MA Theology, Loyola School of Theology'
    },
    {
        id: 8,
        name: 'Ms. Angela Kristina Lopez',
        position: 'Finance & Admin Officer',
        department: 'Administration',
        email: 'angela.lopez@pusongamafoundation.org',
        image: SetImageGoogleById('1aXYEjkrr6U_R5-a-1KFVJl-kBHLEJSQs'),
        bio: 'Ensures transparent and responsible management of foundation resources. Her background in corporate finance helps maintain the highest standards of financial accountability.',
        expertise: ['Financial Management', 'Grant Administration', 'Internal Controls', 'Budget Planning'],
        phone: '+63 989 012 3456',
        education: 'CPA, University of Santo Tomas'
    }
];

// Add expertise field to StaffMember type if not already present
// In your types/localdb.ts, update the StaffMember interface:
/*
export interface StaffMember {
    id: number;
    name: string;
    position: string;
    department: string;
    email: string;
    image: string;
    bio: string;
    expertise?: string[];
    phone?: string;
    education?: string;
}
*/



export { GraduateData, programs, staffMembers, AboutPage }