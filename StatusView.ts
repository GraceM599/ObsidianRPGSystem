import { ItemView, WorkspaceLeaf, TFile, App, moment } from "obsidian";
export const VIEW_TYPE_STATUS = "status-view"

export class StatusView extends ItemView {
	constructor(leaf: WorkspaceLeaf, public app: App, private data: Record<string, string[]>) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_STATUS;
	}

	getDisplayText(): string {
		return "Status Page";
	}
	async clearPage() {
		this.onOpen();
	}
	async onOpen() {
		const container = this.containerEl;
		container.empty();
		container.addClass("status-page-container");

		
		this.loadData();
	}

	async loadData() {
		//create an info and daily note streak bar. Note streak bar just checks if there has been a note edited every day for x days. Adding later.

		
		const container = this.containerEl;
		container.empty();
		container.addClass("status-page-container");

		container.createEl("div", {
			text: `Name: ${ this.data["Name"][0] }` ,
			cls: "status-section-title"
		});

		//in the settings create a list of attributes and possible values of those attributes
		for (const key in this.data) {
			
			const relevantFiles: TFile[] = await this.findFilesWhere(key);
			const completedFiles: TFile[] = [];
			const uncompletedFiles: TFile[] = [];

				
			//sorts files into either completed or uncompleted
			for (const myFile of relevantFiles) {
				const content = await this.app.vault.read(myFile);
				const regex = /^\s*[-*]\s\[ \]\s.*$/gm;
				

				//need to check if the complete by date has passed before shwoing it on uncompleted files
				if (regex.test(content)) {
					uncompletedFiles.push(myFile);
					const newContent = content.replace(/^complete\s*:.*/m, `complete: false`);
					await this.app.vault.modify(myFile, newContent);

				}
				else {
					completedFiles.push(myFile);
					const newContent = content.replace(/^complete\s*:.*/m, `complete: true`);
					await this.app.vault.modify(myFile, newContent);

				}
			}

			//display the different sections
			if (key == "Name") {
				continue;
			}
			else if (key == "DOB") {
				continue;

			}
			else if (key == "Class") {
				const section = container.createDiv({ cls: "status-section" });

				//find total exp for each class
				section.createEl("div", {
					text: `Classes`,
					cls: "status-section-title"
				});

				for (const myClass of this.data[key]) {

					section.createEl("h4", { text: myClass });

					let totalExp = 0;
					for (const myFile of completedFiles) {
						if (await this.checkFrontmatterValue(myFile, "Class", myClass)) {
							const content = this.app.metadataCache.getFileCache(myFile);
							const frontmatter = content?.frontmatter;
							totalExp += frontmatter["Exp"];
						}
					}


					let tempExp = totalExp;
					let level = 0;

					while (tempExp > await this.getExpForLevel(level + 1)) {
						tempExp -= await this.getExpForLevel(level + 1);
						level += 1;
					}

					//display the Class level
					section.createEl("p", { text: `Level: ${level}` });
					
					//progress bar
					const progressBar = section.createEl("progress") as HTMLProgressElement;
					progressBar.max = await this.getExpForLevel(level+1); // XP needed for next level
					progressBar.value = tempExp; // Current XP

					section.createEl("span", { text: '   ' + String(tempExp) + ' / ' + progressBar.max + ' EXP' });

				}
			}

			else {

				//quests/achievements "Completed" + key etc

				for (const fileType of this.data["Type"]) {
					const sectionUncompleted = container.createDiv({ cls: "status-section" });
					sectionUncompleted.createEl("div", {
						text: `${fileType}s Uncompleted`,
						cls: "status-section-title"
					});


					for (const myFile of uncompletedFiles) {
						const cache = this.app.metadataCache.getFileCache(myFile);
						const frontmatter = cache?.frontmatter;
						if (!frontmatter) continue;

						if (!await this.checkFrontmatterValue(myFile, "Type", fileType)) {
							continue;
						}

						const completeByRaw = frontmatter["Complete by"];
						if (!completeByRaw) continue;

						const completeByDate = moment(completeByRaw);
						if (completeByDate.diff(moment().startOf("day"), "days") < 0) continue; // skip overdue


					
						// Creates the file link
						const exp = frontmatter["Exp"];
						const fileLinkLine = sectionUncompleted.createEl("div", { cls: "uncompleted-entry" });

						// Creates clickable link to file
						const fileLink = sectionUncompleted.createEl("a", {
							text: myFile.basename,
							href: myFile.path,
						});
						fileLink.onclick = (e) => {
							e.preventDefault();
							this.app.workspace.openLinkText(myFile.path, '', false);
						};

						fileLinkLine.appendChild(fileLink);

						// Add EXP to side of file name
						fileLinkLine.appendText(` (EXP: ${exp})`);

						// Shows tasks from the file
						await this.displayTasks(myFile, sectionUncompleted);



					}
					//Display as a header the name of the attribute + "s Completed"
					//Add pluralize later


					const sectionCompleted = container.createDiv({ cls: "status-section" });
					sectionCompleted.createEl("div", {
						text: `${fileType}s Completed`,
						cls: "status-section-title"
					});

					for (const myFile of completedFiles) {

						const cache = this.app.metadataCache.getFileCache(myFile);
						const frontmatter = cache?.frontmatter;
						if (!await this.checkFrontmatterValue(myFile, "Type", fileType)) {
							continue;
						}
						// Creates the file link
						const exp = frontmatter["Exp"];
						const fileLinkLine = sectionCompleted.createEl("div", { cls: "uncompleted-entry" });

						// Create clickable link to file
						const fileLink = sectionCompleted.createEl("a", {
							text: myFile.basename,
							href: myFile.path,
						});
						fileLink.onclick = (e) => {
							e.preventDefault();
							this.app.workspace.openLinkText(myFile.path, '', false);
						};

						fileLinkLine.appendChild(fileLink);

						// Add EXP to side of file name
						fileLinkLine.appendText(` (EXP: ${exp})`);
					}

				}
				



			}
			
		}
	}


	async refreshData() {
		await this.onOpen();
	}

	async getExpForLevel(level: number): Promise<number> {
		let exp = 0;
		exp = 100 * level * Math.pow(2, Math.floor((level - 1) / 10));
		return exp;
	}
	async displayTasks(file: TFile, container: HTMLElement) {
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache?.listItems) return;

		const content = await this.app.vault.read(file);
		const lines = content.split("\n");

		// Filter only tasks (list items with a task property)
		const tasks = cache.listItems.filter(item => item.task !== undefined);

		for (const task of tasks) {
			const lineIndex = task.position?.start.line;
			if (lineIndex === undefined) continue;

			const rawLine = lines[lineIndex];
			const isChecked = task.task === "x";

			// Create container for task item
			const taskDiv = container.createDiv({ cls: "task-item" });

			// Checkbox element to complete tasks
			const checkbox = taskDiv.createEl("input", { type: "checkbox" }) as HTMLInputElement;
			checkbox.checked = isChecked;


			// Label element with text of task
			const taskText = rawLine.replace(/^\s*[-*]\s\[[ xX]\]\s*/, "");
			const label = taskDiv.createEl("label", { text: taskText });

			if (checkbox.checked) {
    			label.classList.add('strikethrough');
  			} else {
    			label.classList.remove('strikethrough');
  			}

			// Update file on checkbox toggle
			checkbox.addEventListener("change", async () => {
				const oldLine = lines[lineIndex];
				const newLine = checkbox.checked
					? oldLine.replace(/\[[ xX]\]/, "[x]")
					: oldLine.replace(/\[[ xX]\]/, "[ ]");

				lines[lineIndex] = newLine;
				await this.app.vault.modify(file, lines.join("\n"));
			});
		}
	}

	//returns an array of files where an attribute is defined
	async findFilesWhere(
		attributeName: string
	): Promise<TFile[]> {
		const returnFiles: TFile[] = [];
		const allFiles = this.app.vault.getFiles();
		for (const eachFile of allFiles) {
			if (await this.checkFrontmatterValue(eachFile, attributeName, "none")) {
				returnFiles.push(eachFile);
			}
		}
		return returnFiles;
	}

	

	//checks if a singular file has an attribute that matches a given value. If no value is given returns if the attribute exists for the file.
	async checkFrontmatterValue(
		myFile: TFile,
		attributeName: string,
		expectedValue: any 
	): Promise<boolean> {
		const content = this.app.metadataCache.getFileCache(myFile);
		const frontmatter = content?.frontmatter;
		if (!frontmatter) {
			return false;
		}
		if (frontmatter[attributeName] == null) {
			return false;
		}
		
		if (expectedValue === "none") {
			return true;
		}
		return frontmatter[attributeName] === expectedValue;

		

	}

	async onClose() {
		// Clean up (not usually needed unless you're using timers, listeners, etc.)
	}

	

}
