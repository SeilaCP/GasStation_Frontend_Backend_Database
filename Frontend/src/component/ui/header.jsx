export const Header = () => {
  return (
    <div className="bg-gray-100 font-sans text-gray-800 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-6">
            Store Inventory Tracker
        </h1>
    </div>
  );
}

export const Footer = () => {
  return (
    <div className="bg-gray-100 font-sans text-gray-800 flex flex-col items-center p-4">
        <footer className="w-full max-w-4xl mt-8 py-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Store Inventory Tracker. All rights reserved.</p>
        <p className="mt-1">Built with React and Firebase.</p>
      </footer>
    </div>
  );
}