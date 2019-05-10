import * as vscode from "vscode";
import * as k8s from "vscode-kubernetes-tools-api";

class TiltNode implements k8s.ClusterExplorerV1.Node {
  async getChildren(): Promise<k8s.ClusterExplorerV1.Node[]> {
    return []; // no children in this case
  }
  // TODO(dmiller): customize this node to have the Tilt logo
  getTreeItem(): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      "Tilt",
      vscode.TreeItemCollapsibleState.None
    );
    treeItem.tooltip = "Explore Tilt resources";
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
    return [new TiltNode()];
  }
}

const TILT_NODE_CONTRIBUTOR = new TiltNodeContributor();

export async function activate(context: vscode.ExtensionContext) {
  const explorer = await k8s.extension.clusterExplorer.v1;
  if (!explorer.available) {
    console.log("Unable to register node contributor: " + explorer.reason);
    return;
  }

  explorer.api.registerNodeContributor(TILT_NODE_CONTRIBUTOR);
}

export function deactivate() {}
