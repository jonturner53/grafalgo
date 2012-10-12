IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -O2 -m64 -I ${IDIR}

%.o : %.cpp
	${CXX} ${CXXFLAGS} -c $<

all : testUiList testUiDlist testIdMap testUiClist testUiSetPair testPartition \
	perfUiDlist perfStlList perfStlSet

testUiList: testUiList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testUiDlist: testUiDlist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testIdMap: testIdMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testUiClist: testUiClist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testUiSetPair: testUiSetPair.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testPartition: testPartition.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

perfUiDlist: perfUiDlist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

perfStlList: perfStlList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

perfStlSet: perfStlSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
