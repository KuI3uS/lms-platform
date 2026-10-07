import { Link } from "react-router-dom";
import { BsCalendarCheck } from "react-icons/bs";

export default function TutoringFloatingButton() {
    return (
        <Link
            to="/tutoring-booking"
            className="fixed right-6 bottom-6 z-50 group"
        >
            <div className="relative flex items-center gap-3">
                <div className="hidden md:block opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition bg-gray-900 border border-blue-500/40 text-white px-4 py-3 rounded-2xl shadow-xl max-w-xs">
                    <p className="font-bold text-sm">Potrzebujesz pomocy?</p>
                    <p className="text-xs text-gray-400">
                        Umów się na korepetycje do specjalisty.
                    </p>
                </div>

                <div className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/40 flex items-center justify-center animate-pulse">
                    <BsCalendarCheck className="text-white text-3xl" />
                </div>
            </div>
        </Link>
    );
}