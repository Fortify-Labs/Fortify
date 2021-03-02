import { BoardComponent } from "components/boardComponent";
import { PlayerSelectionDropdown } from "components/playerSelectionDropdown";
import { MatchComponentProps, MatchPlayer } from "definitions/match";
import { useMatchQuery } from "gql/Match.graphql";
import { FunctionComponent, useState } from "react";

export const BoardViewer: FunctionComponent<MatchComponentProps> = ({ id }) => {
	// --- Data fetching ---
	const { data } = useMatchQuery({
		variables: { id },
		errorPolicy: "ignore",
	});

	// --- UI variables ---
	const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
	const [isFlipped, setIsFlipped] = useState(false);

	let players = data?.match?.players ?? [];
	const selectedBasePlayer = players.find(
		(player) => player.id == selectedPlayer
	);
	players = players.slice().sort((a, b) => {
		// Sort primarily by final place, secondary by slot number
		let outcome =
			(a.public_player_state?.final_place ?? 0) -
			(b.public_player_state?.final_place ?? 0);

		if (!outcome) {
			outcome =
				(b.public_player_state?.health ?? 0) -
				(a.public_player_state?.health ?? 0);
		}

		return outcome;
	});

	return (
		<>
			<PlayerSelectionDropdown
				selectedPlayer={selectedPlayer}
				setSelectedPlayer={setSelectedPlayer}
				addNoPlayerOption={true}
				id={id}
			/>
			<label className="checkbox" style={{ marginLeft: "1em" }}>
				<input
					type="checkbox"
					checked={isFlipped}
					onChange={(event) => setIsFlipped(event.target.checked)}
				/>{" "}
				Flip boards
			</label>
			<br />
			<br />
			<div className="columns is-multiline">
				{players.map((playerEntry) => {
					let player: MatchPlayer | undefined = selectedBasePlayer;
					let opponent: MatchPlayer | undefined = playerEntry;

					const personaName =
						opponent?.public_player_state?.persona_name ?? "";
					const opponentID = opponent?.id;
					const opponentUnitCount =
						opponent?.public_player_state?.units?.length ?? 0;

					if (opponent?.id == player?.id) {
						opponent = undefined;
					}

					return (
						<div
							key={`board-${opponentID}-${isFlipped}`}
							className="column is-3"
						>
							<BoardComponent
								player={player}
								opponent={opponent}
								personaName={personaName}
								flip={isFlipped}
								renderUnits={opponentUnitCount > 0}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
};
