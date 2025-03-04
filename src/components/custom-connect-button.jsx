'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    className="hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2 bg-muted hover:bg-muted/80 rounded-full py-0.5 pl-0.5 pr-4 border">
                  <div className="w-8 h-8 rounded-full bg-gray-200"><img src='/profile/pf.svg' className='w-full h-full' /></div>
                  <button 
                    onClick={openAccountModal}
                    className="text-sm capitalize font-semibold text-muted-foreground rounded-lg transition-colors"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;