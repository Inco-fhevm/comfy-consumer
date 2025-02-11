import React from "react";

const Games = () => {
  const games = Array(10).fill({ title: "Hang Man" });

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {games.map((game, index) => (
          <div
            key={index}
            className="flex flex-col border cursor-pointer rounded-xl hover:bg-muted"
          >
            <div className="w-full aspect-square bg-blue-300 rounded-lg mb-2 rounded-b-none"></div>
            <span className="text-sm text-gray-800 p-6 font-semibold">
              {game.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;
