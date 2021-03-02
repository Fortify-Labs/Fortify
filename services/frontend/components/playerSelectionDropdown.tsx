import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMatchQuery } from "gql/Match.graphql";
import React, { FunctionComponent, useEffect } from "react";

export interface UserIdNameMapping {
	id: string;
	persona_name: string;
}

export const PlayerSelectionDropdown: FunctionComponent<{
	selectedPlayer: string | null;
	setSelectedPlayer: React.Dispatch<React.SetStateAction<string | null>>;
	addNoPlayerOption?: boolean;
	id: string;
}> = React.memo(
	({ selectedPlayer, setSelectedPlayer, addNoPlayerOption = false, id }) => {
		const { data } = useMatchQuery({
			variables: { id },
			errorPolicy: "ignore",
		});

		let players =
			data?.match?.players?.map((player) => ({
				id: player.id,
				persona_name: player.public_player_state?.persona_name ?? "",
			})) ?? [];
		players = players.sort((a, b) =>
			(a.persona_name ?? 0) < (b.persona_name ?? 0)
				? -1
				: (a.persona_name ?? 0) > (b?.persona_name ?? 0)
				? 1
				: 0
		);

		if (addNoPlayerOption) {
			players = [
				{
					id: "0",
					persona_name: "No player selected",
				},
				...players,
			];
		}

		useEffect(() => {
			if (window) {
				const storedPlayer = localStorage.getItem("selectedPlayer");

				if (players?.find((player) => player.id === storedPlayer)) {
					setSelectedPlayer(storedPlayer);
				}
			}
		}, [players]);

		return (
			<div
				className="dropdown is-hoverable"
				style={{ display: "inline-block" }}
			>
				<div className="dropdown-trigger">
					<button
						className="button"
						aria-haspopup="true"
						aria-controls="dropdown-menu"
					>
						<span>
							{players?.find(
								(player) => player.id == selectedPlayer
							)?.persona_name || "Player"}
						</span>
						<span className="icon has-text-info">
							<FontAwesomeIcon
								icon={faAngleDown}
								color="white"
								aria-hidden="true"
							/>
						</span>
					</button>
				</div>
				<div className="dropdown-menu" id="dropdown-menu" role="menu">
					<div className="dropdown-content">
						{players.map((value, index) => (
							<button
								className="dropdown-item button is-ghost"
								key={`user_${index}`}
								onClick={() => {
									if (value) {
										setSelectedPlayer(value.id);
										// Also store player selection to LocalStorage
										localStorage.setItem(
											"selectedPlayer",
											value.id
										);
									}
								}}
							>
								{value.persona_name}
							</button>
						))}
					</div>
				</div>
			</div>
		);
	}
);
