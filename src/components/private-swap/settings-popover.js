import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SettingsPopover = () => {
  const [slippageMode, setSlippageMode] = useState("auto");
  const [slippage, setSlippage] = useState("0.5");
  const [deadline, setDeadline] = useState("30");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          <img src="/icons/settings.svg" alt="settings" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[19.5rem] rounded-xl p-6" align="end">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Swap Settings</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-lg">Max slippage</span>
              <Tabs
                value={slippageMode}
                onValueChange={setSlippageMode}
                className="h-10"
              >
                <TabsList className="bg-white border rounded-full px-1">
                  <TabsTrigger
                    value="auto"
                    className="rounded-full h-7 px-2 py-1 data-[state=active]:bg-blue-100 text-black font-semibold data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                  >
                    Auto
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="rounded-full h-7 px-2 py-1 data-[state=active]:bg-blue-100 text-black font-semibold data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                  >
                    0.5%
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg">Tx. deadline</span>
              <div className="flex items-center border rounded-full h-10 px-4 font-semibold">
                <input
                  type="number"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-20 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-500 ml-1">min</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsPopover;
