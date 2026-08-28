import { LoadingState } from "@/components/LoadingState";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingState />
    </div>
  );
}
