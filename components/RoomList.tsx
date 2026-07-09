import { RoomCard } from "@/components/RoomCard";
import type { Room } from "@/types/room";

export function RoomList({ rooms }: { rooms: Room[] }) {
  return (
    <div className="mx-4 mt-4 space-y-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
