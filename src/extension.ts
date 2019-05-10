import * as vscode from "vscode";
import * as k8s from "vscode-kubernetes-tools-api";
import fetch from "node-fetch";

const TILT_URL = "localhost:10350";

class TiltResourceNode implements k8s.ClusterExplorerV1.Node {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  async getChildren(): Promise<k8s.ClusterExplorerV1.Node[]> {
    return [];
  }

  getTreeItem(): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      this.name,
      vscode.TreeItemCollapsibleState.None
    );
    treeItem.tooltip = this.name;
    treeItem.command = {
      title: "Open resource",
      command: "tilt.openResource",
      arguments: [this.name]
    };
    return treeItem;
  }
}

type Resource = {
  Name: string;
  CombinedLog: string;
  BuildHistory: Array<any>;
  CrashLog: string;
  CurrentBuild: any;
  DirectoriesWatched: Array<any>;
  Endpoints: Array<string>;
  PodID: string;
  IsTiltfile: boolean;
  LastDeployTime: string;
  PathsWatched: Array<string>;
  PendingBuildEdits: any;
  PendingBuildReason: number;
  ResourceInfo: {
    PodCreationTime: string;
    PodLog: string;
    PodName: string;
    PodRestarts: number;
    PodUpdateStartTime: string;
    YAML: string;
  };
  RuntimeStatus: string;
  ShowBuildStatus: boolean;
};

type TiltView = {
  Log: string;
  Resources: Array<Resource>;
};

class TiltRootNode implements k8s.ClusterExplorerV1.Node {
  async getChildren(): Promise<k8s.ClusterExplorerV1.Node[]> {
    // TODO(dmiller): error handling
    return fetch(`http://${TILT_URL}/api/view`)
      .then(r => r.json())
      .then((j: TiltView) => {
        return j.Resources.map(r => new TiltResourceNode(r.Name));
      });
  }
  // TODO(dmiller): customize this node to have the Tilt logo
  getTreeItem(): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      "Tilt",
      vscode.TreeItemCollapsibleState.Collapsed
    );
    treeItem.tooltip = "Explore Tilt resources";
    treeItem.iconPath = vscode.Uri.parse("https://tilt.dev/favicon.ico");
    return treeItem;
  }
}

class TiltNodeContributor implements k8s.ClusterExplorerV1.NodeContributor {
  contributesChildren(
    parent: k8s.ClusterExplorerV1.ClusterExplorerNode | undefined
  ): boolean {
    // Is a top level node
    if (!parent) {
      return true;
    }

    return false;
  }

  async getChildren(
    parent: k8s.ClusterExplorerV1.ClusterExplorerNode | undefined
  ): Promise<k8s.ClusterExplorerV1.Node[]> {
    return [new TiltRootNode()];
  }
}

const TILT_NODE_CONTRIBUTOR = new TiltNodeContributor();

const openResource = (name?: string) => {
  if (name) {
    vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.parse(`http://${TILT_URL}/r/${name}`)
    );
  }
};

export async function activate(context: vscode.ExtensionContext) {
  const command = "tilt.openResource";
  context.subscriptions.push(
    vscode.commands.registerCommand(command, openResource)
  );

  const explorer = await k8s.extension.clusterExplorer.v1;
  if (!explorer.available) {
    console.log("Unable to register node contributor: " + explorer.reason);
    return;
  }

  explorer.api.registerNodeContributor(TILT_NODE_CONTRIBUTOR);
}

export function deactivate() {}
