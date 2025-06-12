import React from "react";
import Image from "next/image";

const IconBuilder = ({
  usdcImage,
  incoImage,
  networkImage,
  isEncrypted = true,
}: {
  usdcImage: string;
  incoImage: string;
  networkImage: string;
  isEncrypted: boolean;
}) => {
  if (!isEncrypted) {
    return (
      <div className="w-full h-full rounded-full overflow-hidden relative">
        <Image
          src={usdcImage}
          alt="USDC"
          fill
          className="object-cover rounded-full"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-full border-2 bg-[#E7EEFE] border-primary relative">
      {/* Middle white/light ring */}
      <div className="w-full h-full rounded-full  p-0.5">
        {/* Inner circle container */}
        <div className="w-full h-full rounded-full overflow-hidden relative">
          {/* USDC image as background - covers whole circle */}
          {usdcImage && (
            <Image
              src={usdcImage}
              alt="USDC"
              fill
              className="object-cover rounded-full"
              draggable={false}
            />
          )}

          {/* INCO image covering right half - full width image, clipped to show right half */}
          {incoImage && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <Image
                src={incoImage}
                alt="INCO"
                fill
                className="object-cover"
                style={{
                  clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)",
                }}
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Network image (like Polygon) - overlapped at bottom right */}
      {networkImage && (
        <div className="absolute -bottom-1 bg-white -right-2 w-5 h-5 rounded-full  border-2 border-white shadow-lg flex items-center justify-center">
          <Image
            src={networkImage}
            alt="Network"
            fill
            className="object-contain"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
};

export default IconBuilder;
