import React, { useState, useEffect, useRef, memo } from "react";
import { Lock, Unlock, Loader, X, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const PinInputs = memo(({ onComplete, isLoading }) => {
  const [pins, setPins] = useState(["", "", "", ""]);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPins = [...pins];
    newPins[index] = value.slice(-1);
    setPins(newPins);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (index === 3 && value) {
      const pinCode = newPins.join("");
      if (pinCode.length === 4) {
        onComplete(pinCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pins[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 4).split("");
    const newPins = [...pins];

    pasteData.forEach((value, index) => {
      if (index < 4 && /^\d$/.test(value)) {
        newPins[index] = value;
      }
    });

    setPins(newPins);

    const lastIndex = Math.min(pasteData.length, 4) - 1;
    if (lastIndex >= 0) {
      inputRefs[lastIndex].current?.focus();
    }
  };

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  return (
    <div className="flex justify-center gap-3">
      {pins.map((pin, index) => (
        <Input
          key={index}
          ref={inputRefs[index]}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={pin}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-xl font-semibold bg-gray-50"
          disabled={isLoading}
          autoComplete="off"
        />
      ))}
    </div>
  );
});

PinInputs.displayName = "PinInputs";

const PinDialog = ({ isOpen, onClose, onComplete, isLoading, isMobile }) => {
  const DialogComponent = isMobile ? Sheet : Dialog;
  const DialogContentComponent = isMobile ? SheetContent : DialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const DialogDescriptionComponent = isMobile
    ? SheetDescription
    : DialogDescription;

  return (
    <DialogComponent open={isOpen} onOpenChange={onClose}>
      <DialogContentComponent
        side={isMobile ? "bottom" : undefined}
        className={`${
          isMobile ? "h-[420px] rounded-t-2xl" : "sm:max-w-[400px]"
        } p-0`}
      >
        <DialogHeaderComponent className="px-8 py-6 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              <DialogTitleComponent className="text-xl font-semibold">
                Enter PIN
              </DialogTitleComponent>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescriptionComponent className="text-sm text-gray-500 text-left">
            Enter your 4-digit PIN to reveal your balance
          </DialogDescriptionComponent>
        </DialogHeaderComponent>

        <div className="px-8 pb-8 space-y-8">
          <div className="pt-4">
            <PinInputs onComplete={onComplete} isLoading={isLoading} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
              <ShieldCheck className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <p>
                Your PIN is encrypted and secured using industry-standard
                encryption
              </p>
            </div>

            <div className="text-center text-sm text-gray-500">
              Forgot your PIN?{" "}
              <button className="text-blue-500 hover:underline">
                Reset it here
              </button>
            </div>
          </div>
        </div>
      </DialogContentComponent>
    </DialogComponent>
  );
};

const TotalBalance = memo(({ totalBalance }) => {
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [showPinInput, setShowPinInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const correctPin = "1234";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDecrypt = () => {
    setShowPinInput(true);
  };

  const handleClose = () => {
    setShowPinInput(false);
  };

  const handlePinComplete = (pin) => {
    if (pin === correctPin) {
      setShowPinInput(false);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsEncrypted(false);
      }, 500);
    } else {
      alert("Incorrect PIN");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-semibold">
          {isEncrypted ? "****" : `$${totalBalance.toLocaleString()}`}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrypt}
          disabled={showPinInput || isLoading}
        >
          {isEncrypted ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          <span>Decrypting balance...</span>
        </div>
      )}

      <PinDialog
        isOpen={showPinInput}
        onClose={handleClose}
        onComplete={handlePinComplete}
        isLoading={isLoading}
        isMobile={isMobile}
      />
    </div>
  );
});

TotalBalance.displayName = "TotalBalance";

export default TotalBalance;
