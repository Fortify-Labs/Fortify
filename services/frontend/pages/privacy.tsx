import { Navbar } from "../components/navbar";
import withApollo from "../lib/with-apollo";
import { NextSeo } from "next-seo";

const Privacy = () => {
	return (
		<>
			<NextSeo
				title="Privacy Policy | Fortify"
				description="Fortify's Privacy Policy"
				openGraph={{
					url: `${process.env.NEXT_PUBLIC_URL}/privacy`,
					title: "Privacy Policy | Fortify",
					description: "Fortify's Privacy Policy",
				}}
			/>
			<Navbar />

			<div style={{ margin: "1rem" }} className="content">
				<h1 className="title is-1">Privacy Policy</h1>
				<p>
					This Privacy Policy is meant to help you understand what
					information we collect, how we store this information and
					how you can receive a copy of your information or delete
					them if you wish.
				</p>{" "}
				<h2 className="title is-2">Information Fortify Collects</h2>
				<p>
					By placing the GSI file provided by us in the appropriate
					directory, you consent to us collecting all lobby and match
					data of the games you play in, and the games you spectate.
					The exact information collected from these lobbies are
					broadly categorized into three parts -
				</p>
				<ul>
					<li>
						Public Player State - The public player state is data
						that relates to the entire lobby itself. This includes
						the following:
						<ul>
							<li>Account ID </li>
							<li>Connection Status</li>
							<li>Health</li>
							<li>Gold</li>
							<li>Level</li>
							<li>XP</li>
							<li>Final Place</li>
							<li>XP until next level</li>
							<li>Shop reroll modifiers</li>
							<li>Reroll cost modifiers</li>
							<li>Win streaks</li>
							<li>Lose streaks</li>
							<li>Rank</li>
							<li>Disconnected Time</li>
							<li>Platform</li>
							<li>Current Steam Name</li>
							<li>Amount of Wins</li>
							<li>Amount of Losses</li>
							<li>Cosmetic Loadout</li>
							<li>Net Worth</li>
							<li>Results of combat vs other players</li>
							<li>Lobby team</li>
							<li>Whether the fight was mirrored</li>
							<li>Underlord Choice</li>
							<li>Board Unit Limit</li>
							<li>Combat Type</li>
							<li>Brawny Kill Count</li>
							<li>Prestige Level</li>
							<li>Global Leaderboard Rank</li>
							<li>Units</li>
							<li>Alliances</li>
							<li>Combat Duration</li>
							<li>Wins / Losses / Draws vs Opponents</li>
							<li>Item Choices</li>
						</ul>
					</li>
					<li>
						Private Player State - This includes data that pertains
						only to you, which is not shown to other players in the
						lobby. This includes the following:
						<ul>
							<li>Unclaimed Battle Pass Rewards</li>
							<li>Whether the shop is locked</li>
							<li>Units in the shop</li>
							<li>Gold earned this round</li>
							<li>Reroll Cost</li>
							<li>Whether underlords can be selected</li>
							<li>Whether the latest item pack was rerolled</li>
							<li>Hero buckets (in Knockout)</li>
							<li>Oldest Unclaimed Reward</li>
							<li>Challenges</li>
							<li>Underlords Choices</li>
						</ul>
					</li>
					<li>
						Leaderboard Rank and MMR - Using your steam name we also
						keep a history of your Rank and MMR (from the time you
						have registered with us) using the global leaderboard
						which is available for everyone to see.
					</li>
				</ul>
				<h2 className="title is-2">Information Storage</h2>
				<p>
					All the data collected by Fortify is stored by the owner of
					the platform on servers located in Nürnberg (Germany) and is
					used solely for the purpose of processing the data and
					displaying the results on the Fortify platform. None of the
					data is forwarded to any third parties whatsoever, and is
					never sold to any third parties for monetary benefit or
					otherwise.
				</p>
				<h2 className="title is-2">
					Exporting and Deleting the Information Collected by Fortify
				</h2>
				<p>
					In compliance with GDPR, all of the data we store can always
					be received by the owner and deleted when required. If you
					want a copy of the data we store in relation to you or want
					a full wipe of all the data stored for your profile, please
					contact us directly and we will process your request as soon
					as possible.
				</p>
				<br />
			</div>
		</>
	);
};

export default withApollo(Privacy);
