
import { cn } from '@/lib/utils'
import { APP } from '@/lib/constants'

interface AppFooterProps {
    className?: string
    variant?: 'default' | 'minimal'
}

export function AppFooter({ className, variant = 'default' }: AppFooterProps) {
    if (variant === 'minimal') {
        return (
            <footer className={cn("text-center py-4", className)}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    {APP.name} &bull; v{APP.version}
                </p>
            </footer>
        )
    }

    return (
        <footer className={cn("py-8 text-center space-y-1", className)}>
            <p className="text-xs font-medium text-gray-400">{APP.name} v{APP.version}</p>
            <p className="text-[10px] text-gray-300">Updated: {APP.lastUpdate}</p>
            <p className="text-[10px] text-gray-300">© 2026 {APP.fullName}</p>
        </footer>
    )
}
