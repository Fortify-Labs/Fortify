import { FunctionComponent, Dispatch, SetStateAction } from "react";
import classNames from "classnames";
import { download, GSIFileTemplate } from "lib/gsiFileGenerator";
import { useGsiTokenMutation } from "gql/GsiToken.graphql";

export const GSIModal: FunctionComponent<{
	visible: boolean;
	setVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ visible, setVisible }) => {
	const [generateGsiToken] = useGsiTokenMutation();

	return (
		<div
			className={classNames("modal", {
				"is-active": visible,
			})}
		>
			<div
				className="modal-background"
				onClick={() => setVisible(false)}
			></div>
			<div className="modal-card">
				<header className="modal-card-head">
					<p className="modal-card-title">GSI Setup</p>
					<button
						className="delete"
						aria-label="close"
						onClick={() => setVisible(false)}
					></button>
				</header>
				<section className="modal-card-body">
					Follow these steps to set up Fortify on your computer -
					<ul>
						<li>
							Download - Download the file by clicking the button
							below (gamestate_integration_fortify.cfg). This is a
							configuration file generated for your account in
							specific
						</li>
						<li>
							Open Underlords Game Files -
							<ul>
								<li>
									Open steam, and right click Dota Underlords
									on the left
								</li>
								<li>
									In the menu you see, click "Manage" and then
									click on "Browse Local Game Files"
								</li>
								<li>
									This should open up a folder on your
									computer. Go into the folder called "game"
								</li>
								<li>
									In the new folder you see, go into "dac"
								</li>
								<li>Inside the dac folder, go into "cfg"</li>
							</ul>
						</li>
						<li>
							Creating gamestate_integration folder and placing
							the file inside it -
							<ul>
								<li>
									In the current cfg folder, create a new
									folder called "gamestate_integration"
									(without the quotes)
								</li>
								<li>
									Copy the file you downloaded
									(gamestate_integration_fortify.cfg) and
									place it inside this new folder you have
									created
								</li>
							</ul>
						</li>
						<li>
							Testing to see if the setup is done correctly -
							<ul>
								<li>
									Open up underlords and spectate a friend's
									game if possible (or enter a casual game)
								</li>
								<li>
									Wait for a round or two and then type !np to
									see if the lobby information shows up
								</li>
								<li>
									It should show entire lobby information with
									their average MMR, if it does not, double
									check the steps written here to see if you
									did everything correctly. If it still does
									not work, please contact us and we will
									resolve the issue for you
								</li>
							</ul>
						</li>
					</ul>
				</section>
				<footer className="modal-card-foot">
					<button
						className="button is-success"
						onClick={async () => {
							const { data, errors } = await generateGsiToken();

							if (errors || !data) {
								alert(
									"An error occured while generating the GSI file."
								);
								return;
							}

							download(
								"gamestate_integration_fortify.cfg",
								GSIFileTemplate(data.generateGsiJwt)
							);
						}}
					>
						Download file
					</button>
					<button
						className="button"
						onClick={() => setVisible(false)}
					>
						Close
					</button>
				</footer>
			</div>
		</div>
	);
};
