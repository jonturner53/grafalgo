JROOT := ~/bin/java

all:
	make -C misc	JROOT='${JROOT}' all
	make -C mst  	JROOT='${JROOT}' all
	make -C sPath	JROOT='${JROOT}' all
	make -C maxFlo	JROOT='${JROOT}' all
	make -C mcFlo	JROOT='${JROOT}' all
	make -C match	JROOT='${JROOT}' all

clean:
	make -C misc   clean
	make -C mst    clean
	make -C sPath  clean
	make -C maxFlo clean
	make -C mcFlo  clean
	make -C match  clean
