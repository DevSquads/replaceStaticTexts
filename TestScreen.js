import React from "react";

class TestClass extends React.Component {
  render() {
    return <View>    
      <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>
      <View><Text>{I18n.t("TestScreen.JSXText.index(1)")}</Text></View>
    </View>;
  }

}