export const AssetList = ({ filteredAssets, onAssetSelect }) => (
  <div className="px-4 overflow-y-auto h-[400px] pb-8">
    {filteredAssets.map((asset, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-4 pointer rounded-lg mb-2"
        onClick={() => onAssetSelect(asset)}
      >
        <div className="flex items-center gap-3">
          <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
          <div>
            <div className="font-medium">{asset.name}</div>
            {asset.chain && asset.chain !== "Ethereum" && (
              <div className="text-sm text-gray-500">on {asset.chain}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {asset.amount} <span>{asset.name}</span>
          </div>
          <div className="text-gray-500 text-sm">{asset.value}</div>
        </div>
      </div>
    ))}
  </div>
);
