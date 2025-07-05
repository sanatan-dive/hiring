import { cn } from '@/lib/utils'
import React from 'react'

enum VaraintColor {
    orange = 'orange',
    blue = 'blue',
    green = 'green'
}

const GlowButton = ({
    children,
    variant = VaraintColor.orange,
    className
}: {
    children: React.ReactNode,
    variant?: string,
    disableChevron?: boolean,
    className?: string
}) => {
    return (
        <button className={cn("hover:opacity-[0.90] rounded-[1.1rem] border font-extralight px-4  relative text-blue-50 font-poppins overflow-hidden after:absolute after:content-[''] after:inset-0 after:[box-shadow:0_0_15px_-1px_#ffffff90_inset] after:rounded-[1rem] before:absolute before:content-[''] before:inset-0  before:rounded-[1rem] flex items-center before:z-20 after:z-10",
            variant === VaraintColor.orange ? "[box-shadow:0_0_100px_-10px_#DE732C] before:[box-shadow:0_0_4px_-1px_#fff_inset] bg-[#DE732C]  border-[#f8d4b3]/80 " : variant === VaraintColor.blue ? "[box-shadow:0_0_100px_-10px_#0165FF] before:[box-shadow:0_0_7px_-1px_#d5e5ff_inset] bg-[#126fff]  border-[#9ec4ff]/90"
                : "[box-shadow:0_0_100px_-10px_#21924c] before:[box-shadow:0_0_7px_-1px_#91e6b2_inset] bg-[#176635]  border-[#c0f1d3]/70", className)}>
            
              
                <p>{children}</p>
            
           
        </button>
    )
}

export default GlowButton