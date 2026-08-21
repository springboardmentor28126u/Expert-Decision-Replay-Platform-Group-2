import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconHome } from '@tabler/icons-react';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="h-20 w-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">404</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium transition-colors"
      >
        <IconHome size={18} />
        Back to Home
      </Link>
    </motion.div>
  );
}
