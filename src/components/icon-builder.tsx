import Image from "next/image";

interface IconBuilderProps {
  usdcImage: string;
  incoImage: string;
  networkImage: string;
  isEncrypted: boolean;
  isCustom?: boolean;
  symbol?: string;
}

const IconBuilder = ({
  usdcImage,
  incoImage,
  networkImage,
  isEncrypted = true,
  isCustom = false,
  symbol,
}: IconBuilderProps) => {
  const initials = (symbol ?? "?").slice(0, 3).toUpperCase();

  const coinFace = isCustom ? (
    <div className="w-full h-full rounded-full flex items-center justify-center bg-[#3673F5] text-white font-semibold text-[0.6rem] leading-none">
      {initials}
    </div>
  ) : (
    <>
      {usdcImage && (
        <Image
          src={usdcImage}
          alt={symbol ?? "token"}
          fill
          className="object-cover rounded-full"
          draggable={false}
        />
      )}
      {isEncrypted && incoImage && (
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
    </>
  );

  if (!isEncrypted) {
    return (
      <div className="w-full h-full rounded-full overflow-hidden relative">
        {coinFace}
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-full border-2 bg-[#E7EEFE] border-primary relative">
      {/* Middle white/light ring */}
      <div className="w-full h-full rounded-full p-0.5">
        {/* Inner circle container */}
        <div className="w-full h-full rounded-full overflow-hidden relative">
          {coinFace}
        </div>
      </div>

      {networkImage && (
        <div className="absolute -bottom-1 bg-white -right-2 w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
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
