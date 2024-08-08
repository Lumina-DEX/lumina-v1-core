import { Database } from "@/lib/database.types";
import useSupabaseFunctions from "@/services/supabase";
import { useEffect, useState } from "react";
import { Table } from "react-daisyui";

function LeaderboardPanel() {
  const { getLeaderboard } = useSupabaseFunctions();
  const [members, setMembers] = useState<
    Database["public"]["Tables"]["leaderboard"]["Row"][]
  >([]);

  useEffect(() => {
    getLeaderboard().then((response) => {
      if (
        response.status === 200 &&
        Array.isArray(response.data) &&
        response.data
      ) {
        setMembers(response.data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between gap-4 p-4 bg-light-100">
      <div className="h-[350px] overflow-y-auto">
        <Table className="rounded-box" zebra>
          <Table.Head className="text-base text-default">
            <div className="flex justify-start">
              <span>@X Name</span>
            </div>
            <div className="flex justify-center">
              <span>Points</span>
            </div>
            <div className="flex justify-center">
              <span>Rank</span>
            </div>
          </Table.Head>
          <Table.Body>
            {members
              .sort((a, b) => (b.points || 0) - (a.points || 0))
              .map((member, index) => (
                <Table.Row key={index}>
                  <div className="flex justify-start">
                    <span>{member.name}</span>
                  </div>
                  <div className="flex justify-center">
                    <span>{member.points}</span>
                  </div>
                  <div className="flex justify-center">
                    <span>{index + 1}</span>
                  </div>
                </Table.Row>
              ))}
          </Table.Body>
        </Table>
      </div>

      <span className="font-metrophobic text-base text-black">
        Read the{" "}
        <a className="underline" href="https://luminadex.com" rel="noopener">
          LuminaDEXChallenge
        </a>{" "}
        announcement and learn more about the{" "}
        <a className="underline" href="https://luminadex.com" rel="noopener">
          Points scoring
        </a>
      </span>
    </div>
  );
}
export default LeaderboardPanel;
