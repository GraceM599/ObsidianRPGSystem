import { App, Menu, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_STATUS, StatusView } from "./StatusView";
// Remember to rename these classes and interfaces!


interface RPGPluginSettings {
	mySetting: string;
	settingData: Record<string, string[]>;
	myName: string;
	DOB: Date;
}

const DEFAULT_SETTINGS: RPGPluginSettings = {
	mySetting: 'default',
	settingData: {},
	myName: 'myName',
	DOB: new Date(1980, 4, 4)
}

export default class RPGPlugin extends Plugin {
	settings: RPGPluginSettings;
	private QUEST_TEMPLATE = `---
Type: Quest
Exp: 10
Complete by: 
Class: Mage
---

- [ ] Sample Task
`;

	private ACHIEVEMENT_TEMPLATE = `---
Type: Achievement
Exp: 10
Complete by: 
Class: Mage
---

- [ ] Sample Task
`;

	async onload() {

		await this.loadSettings();
			
	

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', async (evt: MouseEvent) => {
			await sleep(5000);
			this.refreshView();
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


		//sets up the Status window
		this.settings.settingData["Type"] = ["Quest", "Achievement"];

		this.registerView(VIEW_TYPE_STATUS, (leaf) => new StatusView(leaf, this.app, this.settings.settingData));

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('bar-chart', 'Open Status Page', (evt: MouseEvent) => {
			//
		});

		// Left click opens the Status View while right click shows a template menu for quest and achievements
		ribbonIconEl.addEventListener("click", (evt) => {
			evt.preventDefault();
			if (evt.button === 0) {
				this.activateView();
			}
		});

		ribbonIconEl.addEventListener("contextmenu", (evt) => {
			evt.preventDefault();

			const menu = new Menu();

			menu.addItem((item) =>
				item
					.setTitle('New Quest')
					.setIcon('scroll')
					.onClick(async () => {
						// Define the new file path
						const newFilePath = `New Quest ${Date.now()}.md`;

						// Create the file with your metadata template as content
						await this.app.vault.create(newFilePath, this.QUEST_TEMPLATE);

						new Notice('New Quest created!');
					})
			);

			menu.addItem((item) =>
				item
					.setTitle('New Achievement')
					.setIcon('trophy')
					.onClick(async () => {
						// Define the new file path
						const newFilePath = `New Achievement ${Date.now()}.md`;

						// Create the file with your metadata template as content
						await this.app.vault.create(newFilePath, this.QUEST_TEMPLATE);

						new Notice('New Achievement created!');
					})
			);

			menu.showAtMouseEvent(evt);
		});



		

		
		this.addCommand({
			id: "open-status-view",
			name: "Open Status Page",
			callback: () => this.activateView(),
		});


	}

	onunload() {

	}

	
	

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_STATUS);

		if (leaves.length > 0) {
			// A leaf with view already exists, use that
			leaf = leaves[0];
		} else {
			// View could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: VIEW_TYPE_STATUS, active: true });
		}

		// "Reveals" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	async refreshView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_STATUS);

		if (leaves.length > 0) {
			const leaf = leaves[0];
			const view = leaf.view;

			// Cast the view to the StatusView class
			if (view instanceof StatusView) {
				view.refreshData();
			}
		}
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.settingData["Name"] = [this.settings.myName];
		this.settings.settingData["DOB"] = [JSON.stringify(this.settings.DOB)];

		this.settings.settingData["Class"] = []; // makes sure old data is gone

		const settingsArray: string[] = this.settings.mySetting
			.split(",")
			.map(s => s.trim()) 
			.filter(s => s.length > 0); 

		//adds the specified Classes
		for (const word of settingsArray) {
			this.settings.settingData["Class"].push(word); 
		}
		
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: RPGPlugin;

	constructor(app: App, plugin: RPGPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		//Space to enter Classes
		new Setting(containerEl)
			.setName('Classes: ')
			.setDesc('Enter your classes seperated by a comma. (Ex. Warlock, Mage)')
			.addText(text => text
				.setPlaceholder('Mage')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();

				}));

		//Space to enter users name
		new Setting(containerEl)
			.setName('Name: ')
			.setDesc('Enter your name')
			.addText(text => text
				.setPlaceholder('Bob')
				.setValue(this.plugin.settings.myName)
				.onChange(async (value) => {
					this.plugin.settings.myName = value;
					await this.plugin.saveSettings();

				}));

		//Being used later. Enters DOB into plugin settings
		new Setting(containerEl)
			.setName('Date of Birth: ')
			.setDesc('Enter your birthday')
			.addText(text => {
				// Turn the text field into a date picker
				text.inputEl.type = "date";

				// Show stored date (formatted as YYYY-MM-DD)
				const dob = this.plugin.settings.DOB;
				text.setValue(dob.toISOString().split("T")[0]);

				// Handle date change
				text.onChange(async (value) => {
					const newDob = new Date(value);
					this.plugin.settings.DOB = newDob;
					await this.plugin.saveSettings();
				});
			});
	}
}
