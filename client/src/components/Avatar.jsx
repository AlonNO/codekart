export default function Avatar({ username, borderId = 'default', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 md:w-32 md:h-32 text-4xl md:text-5xl'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black text-white bg-gray-800 avatar-border-${borderId}`}>
      {username?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}