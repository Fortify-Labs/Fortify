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
					TODO: GSI setup description
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
