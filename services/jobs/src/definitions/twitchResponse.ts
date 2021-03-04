export interface TwitchStreamsResponse {
	stream?: Stream;
}

export interface Stream {
	_id: number;
	game: string;
	viewers: number;
	video_height: number;
	average_fps: number;
	delay: number;
	created_at: Date;
	is_playlist: boolean;
	preview: Preview;
	channel: Channel;
}

export interface Channel {
	mature: boolean;
	status: string;
	broadcaster_language: string;
	display_name: string;
	game: string;
	language: string;
	_id: number;
	name: string;
	created_at: Date;
	updated_at: Date;
	partner: boolean;
	logo: string;
	video_banner: string;
	profile_banner: string;
	profile_banner_background_color: null;
	url: string;
	views: number;
	followers: number;
}

export interface Preview {
	small: string;
	medium: string;
	large: string;
	template: string;
}
