const MissionVision = () => {
    return (
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Mission Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="text-red-600 mb-4">
            {/* Heart Hands icon for Mission */}
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-4">Our Mission</h3>
          <p className="text-gray-700">
            To empower communities through sustainable solutions that drive positive change, enhance quality of life, and create lasting impact. We are committed to serving those in need with compassion, integrity, and a shared vision for a better world.
          </p>
        </div>
  
        {/* Vision Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="text-red-600 mb-4">
            {/* Globe icon for Vision */}
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-4">Our Vision</h3>
          <p className="text-gray-700">
            To create a world where every community thrives with dignity, equality, and opportunity. We envision a future where compassion drives action, where no one is left behind, and where sustainable development creates lasting positive change for generations to come.
          </p>
        </div>
      </div>
    );
  };
  
  export default MissionVision;