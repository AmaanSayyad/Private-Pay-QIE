import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { Icons } from "../components/shared/Icons.jsx";

export default function SendPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full items-start justify-center py-20 px-4 md:px-10">
      <div className="relative flex flex-col gap-4 w-full max-w-md items-center justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6">
        <div className="flex items-center justify-between w-full mb-2">
          <h1 className="font-bold text-lg text-[#19191B]">Send Payment</h1>
          <Button
            onClick={() => navigate("/")}
            className="bg-white rounded-full px-4 h-10 flex items-center gap-2"
          >
            <Icons.back className="size-4" />
            <span className="text-sm">Back</span>
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4 py-12">
          <div className="text-6xl">🚧</div>
          <h2 className="text-xl font-bold text-gray-800">Coming Soon</h2>
          <p className="text-gray-600 text-center">
            QIE payment functionality is being implemented. 
            This feature will be available after the migration is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
