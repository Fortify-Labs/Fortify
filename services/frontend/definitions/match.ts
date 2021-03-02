import { PrivatePlayerState, PublicPlayerState } from "gql/Match.graphql";

export interface MatchComponentProps {
	id: string;
}

export interface MatchPlayer {
	id: string;
	public_player_state?: Partial<PublicPlayerState> | null;
	private_player_state?: Partial<PrivatePlayerState> | null;
}
